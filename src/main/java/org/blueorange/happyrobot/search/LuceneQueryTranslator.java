package org.blueorange.happyrobot.search;

import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.analysis.TokenStream;
import org.apache.lucene.analysis.tokenattributes.CharTermAttribute;
import org.apache.lucene.document.DoublePoint;
import org.apache.lucene.document.IntPoint;
import org.apache.lucene.document.LongPoint;
import org.apache.lucene.index.Term;
import org.apache.lucene.queryparser.classic.MultiFieldQueryParser;
import org.apache.lucene.queryparser.classic.ParseException;
import org.apache.lucene.queryparser.classic.QueryParserBase;
import org.apache.lucene.search.BooleanClause;
import org.apache.lucene.search.BooleanQuery;
import org.apache.lucene.search.BoostQuery;
import org.apache.lucene.search.FuzzyQuery;
import org.apache.lucene.search.MatchAllDocsQuery;
import org.apache.lucene.search.MatchNoDocsQuery;
import org.apache.lucene.search.PhraseQuery;
import org.apache.lucene.search.PrefixQuery;
import org.apache.lucene.search.RegexpQuery;
import org.apache.lucene.search.Sort;
import org.apache.lucene.search.SortField;
import org.apache.lucene.search.WildcardQuery;
import org.apache.lucene.search.spans.SpanMultiTermQueryWrapper;
import org.apache.lucene.search.spans.SpanNearQuery;
import org.apache.lucene.search.spans.SpanQuery;
import org.apache.lucene.search.spans.SpanTermQuery;
import org.apache.lucene.util.BytesRef;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

/**
 * Translates the granular {@link Query} model into the equivalent Apache Lucene
 * {@link org.apache.lucene.search.Query} and {@link Sort}. This is the embedded-Lucene counterpart
 * of the server-side translation that the search-sdk performs against Elasticsearch.
 *
 * <p>The translator is stateless aside from the configured {@link Analyzer} and default text
 * fields, so a single instance can be shared across searches.
 */
public class LuceneQueryTranslator {

    /** The Lucene query and sort produced from a {@link Query}. A null sort means sort by relevance. */
    public record Translated(org.apache.lucene.search.Query query, Sort sort) {
    }

    private final Analyzer analyzer;
    private final String[] defaultTextFields;

    public LuceneQueryTranslator(Analyzer analyzer, String[] defaultTextFields) {
        this.analyzer = analyzer;
        this.defaultTextFields = defaultTextFields.clone();
    }

    /** Translates a whole request into a Lucene query plus an optional sort. */
    public Translated translate(Query query) {
        org.apache.lucene.search.Query lucene = query.getRootCondition() == null
                ? new MatchAllDocsQuery()
                : translateComponent(query.getRootCondition(), query.getMinimumShouldMatch());
        Sort sort = buildSort(query.getSortConditions());
        return new Translated(lucene, sort);
    }

    // --- Tree translation -----------------------------------------------------

    private org.apache.lucene.search.Query translateComponent(QueryComponent component, int minimumShouldMatch) {
        if (component instanceof QueryCompositeCondition composite) {
            return translateComposite(composite, minimumShouldMatch);
        }
        if (component instanceof QueryCondition leaf) {
            return translateLeaf(leaf);
        }
        throw new IllegalArgumentException("Unsupported query component: "
                + (component == null ? "null" : component.getClass().getName()));
    }

    private org.apache.lucene.search.Query translateComposite(QueryCompositeCondition composite, int minimumShouldMatch) {
        if (composite.getOperand() == null) {
            throw new IllegalArgumentException("Composite condition is missing its operand");
        }
        List<QueryComponent> children = composite.getComponents();
        if (children == null || children.isEmpty()) {
            // An empty composite imposes no constraint.
            return new MatchAllDocsQuery();
        }

        BooleanQuery.Builder builder = new BooleanQuery.Builder();
        switch (composite.getOperand()) {
            case AND -> {
                for (QueryComponent child : children) {
                    builder.add(translateComponent(child, minimumShouldMatch), BooleanClause.Occur.MUST);
                }
            }
            case OR -> {
                for (QueryComponent child : children) {
                    builder.add(translateComponent(child, minimumShouldMatch), BooleanClause.Occur.SHOULD);
                }
                builder.setMinimumNumberShouldMatch(Math.max(1, Math.min(minimumShouldMatch, children.size())));
            }
            case NOT -> {
                // Exclude any document matching a child, against a match-all base.
                builder.add(new MatchAllDocsQuery(), BooleanClause.Occur.MUST);
                for (QueryComponent child : children) {
                    builder.add(translateComponent(child, minimumShouldMatch), BooleanClause.Occur.MUST_NOT);
                }
            }
        }
        return builder.build();
    }

    private org.apache.lucene.search.Query translateLeaf(QueryCondition leaf) {
        if (leaf.getFullText() != null) {
            return fullText(leaf.getFullText());
        }
        if (leaf.getTerm() != null) {
            return term(leaf.getTerm());
        }
        if (leaf.getNumeric() != null) {
            return numeric(leaf.getNumeric());
        }
        if (leaf.getDate() != null) {
            return date(leaf.getDate());
        }
        throw new IllegalArgumentException("QueryCondition has no concrete condition set");
    }

    // --- Leaf conditions ------------------------------------------------------

    private org.apache.lucene.search.Query fullText(QueryFullTextCondition condition) {
        if (condition.getQuery() == null || condition.getQuery().isBlank()) {
            throw new IllegalArgumentException("Full-text condition requires a non-blank query");
        }
        String[] fields = (condition.getFields() == null || condition.getFields().isEmpty())
                ? defaultTextFields
                : condition.getFields().toArray(new String[0]);

        String escaped = QueryParserBase.escape(condition.getQuery());
        if (condition.getFuzziness() != null && !condition.getFuzziness().isBlank()) {
            escaped = applyFuzziness(escaped, condition.getFuzziness());
        }

        MultiFieldQueryParser parser = new MultiFieldQueryParser(fields, analyzer);
        try {
            return parser.parse(escaped);
        } catch (ParseException e) {
            throw new IllegalArgumentException("Could not parse full-text query: " + condition.getQuery(), e);
        }
    }

    /** Appends a Lucene fuzzy operator to each whitespace-separated token. */
    private String applyFuzziness(String escapedQuery, String fuzziness) {
        String suffix = "AUTO".equalsIgnoreCase(fuzziness) ? "~" : "~" + fuzziness;
        StringBuilder sb = new StringBuilder();
        for (String token : escapedQuery.trim().split("\\s+")) {
            if (token.isEmpty()) {
                continue;
            }
            if (sb.length() > 0) {
                sb.append(' ');
            }
            sb.append(token).append(suffix);
        }
        return sb.toString();
    }

    private org.apache.lucene.search.Query term(QueryTermCondition condition) {
        requireField(condition.getField());
        if (condition.getType() == null) {
            throw new IllegalArgumentException("Term condition on '" + condition.getField() + "' requires a type");
        }
        if (condition.getQuery() == null || condition.getQuery().isEmpty()) {
            throw new IllegalArgumentException("Term condition on '" + condition.getField() + "' requires a query");
        }

        String field = condition.getField();
        org.apache.lucene.search.Query query = switch (condition.getType()) {
            case PHRASE -> phrase(field, condition.getQuery());
            case PHRASE_PREFIX -> phrasePrefix(field, condition.getQuery());
            case FUZZY -> new FuzzyQuery(
                    new Term(field, normalizeTerm(field, condition.getQuery(), condition.getCaseInsensitive())),
                    condition.getMaxEdits() == null ? FuzzyQuery.defaultMaxEdits : condition.getMaxEdits());
            case REGEX -> new RegexpQuery(
                    new Term(field, normalizeTerm(field, condition.getQuery(), condition.getCaseInsensitive())));
            case WILDCARD -> new WildcardQuery(
                    new Term(field, normalizeTerm(field, condition.getQuery(), condition.getCaseInsensitive())));
        };

        if (condition.getBoost() != null && condition.getBoost() != 1.0f) {
            query = new BoostQuery(query, condition.getBoost());
        }
        return query;
    }

    private org.apache.lucene.search.Query phrase(String field, String text) {
        List<String> tokens = analyze(field, text);
        if (tokens.isEmpty()) {
            return new MatchNoDocsQuery();
        }
        PhraseQuery.Builder builder = new PhraseQuery.Builder();
        for (String token : tokens) {
            builder.add(new Term(field, token));
        }
        return builder.build();
    }

    private org.apache.lucene.search.Query phrasePrefix(String field, String text) {
        List<String> tokens = analyze(field, text);
        if (tokens.isEmpty()) {
            return new MatchNoDocsQuery();
        }
        PrefixQuery lastPrefix = new PrefixQuery(new Term(field, tokens.get(tokens.size() - 1)));
        if (tokens.size() == 1) {
            return lastPrefix;
        }
        // Earlier tokens must match as an in-order phrase, immediately followed by the prefix term.
        SpanQuery[] clauses = new SpanQuery[tokens.size()];
        for (int i = 0; i < tokens.size() - 1; i++) {
            clauses[i] = new SpanTermQuery(new Term(field, tokens.get(i)));
        }
        clauses[tokens.size() - 1] = new SpanMultiTermQueryWrapper<>(lastPrefix);
        return new SpanNearQuery(clauses, 0, true);
    }

    private org.apache.lucene.search.Query numeric(QueryNumericCondition condition) {
        LoadField field = requireField(condition.getField());
        return switch (field.type()) {
            case DOUBLE -> doubleRange(field.fieldName(), condition);
            case INT -> intRange(field.fieldName(), condition);
            default -> throw new IllegalArgumentException(
                    "Field '" + field.fieldName() + "' is not numeric and cannot take a numeric condition");
        };
    }

    private org.apache.lucene.search.Query doubleRange(String field, QueryNumericCondition c) {
        double lower = Double.NEGATIVE_INFINITY;
        if (c.getGte() != null) {
            lower = Math.max(lower, c.getGte());
        }
        if (c.getGt() != null) {
            lower = Math.max(lower, Math.nextUp(c.getGt()));
        }
        double upper = Double.POSITIVE_INFINITY;
        if (c.getLte() != null) {
            upper = Math.min(upper, c.getLte());
        }
        if (c.getLt() != null) {
            upper = Math.min(upper, Math.nextDown(c.getLt()));
        }
        return DoublePoint.newRangeQuery(field, lower, upper);
    }

    private org.apache.lucene.search.Query intRange(String field, QueryNumericCondition c) {
        long lower = Integer.MIN_VALUE;
        if (c.getGte() != null) {
            lower = Math.max(lower, (long) Math.ceil(c.getGte()));
        }
        if (c.getGt() != null) {
            lower = Math.max(lower, (long) Math.floor(c.getGt()) + 1);
        }
        long upper = Integer.MAX_VALUE;
        if (c.getLte() != null) {
            upper = Math.min(upper, (long) Math.floor(c.getLte()));
        }
        if (c.getLt() != null) {
            upper = Math.min(upper, (long) Math.ceil(c.getLt()) - 1);
        }
        if (lower > upper) {
            return new MatchNoDocsQuery();
        }
        return IntPoint.newRangeQuery(field, (int) lower, (int) upper);
    }

    private org.apache.lucene.search.Query date(QueryDateCondition condition) {
        LoadField field = requireField(condition.getField());
        if (field.type() != LoadField.FieldType.DATE) {
            throw new IllegalArgumentException(
                    "Field '" + field.fieldName() + "' is not a date and cannot take a date condition");
        }
        long lower = Long.MIN_VALUE;
        if (condition.getGte() != null) {
            lower = Math.max(lower, parseInstantMillis(condition.getGte()));
        }
        if (condition.getGt() != null) {
            lower = Math.max(lower, parseInstantMillis(condition.getGt()) + 1);
        }
        long upper = Long.MAX_VALUE;
        if (condition.getLte() != null) {
            upper = Math.min(upper, parseInstantMillis(condition.getLte()));
        }
        if (condition.getLt() != null) {
            upper = Math.min(upper, parseInstantMillis(condition.getLt()) - 1);
        }
        if (lower > upper) {
            return new MatchNoDocsQuery();
        }
        return LongPoint.newRangeQuery(field.fieldName(), lower, upper);
    }

    // --- Sorting --------------------------------------------------------------

    private Sort buildSort(List<SortCondition> sortConditions) {
        if (sortConditions == null || sortConditions.isEmpty()) {
            return null;
        }
        List<SortField> fields = new ArrayList<>();
        boolean hasRelevance = false;
        for (SortCondition condition : sortConditions) {
            if (SortCondition.RELEVANCE.equals(condition.getField())) {
                fields.add(relevanceSortField(condition.getDirection()));
                hasRelevance = true;
                continue;
            }
            LoadField field = requireField(condition.getField());
            if (!field.sortable()) {
                throw new IllegalArgumentException("Field '" + field.fieldName() + "' is not sortable");
            }
            boolean reverse = condition.getDirection() == SortDirection.DESC;
            SortField.Type type = switch (field.type()) {
                case DOUBLE -> SortField.Type.DOUBLE;
                case INT -> SortField.Type.INT;
                case DATE -> SortField.Type.LONG;
                case KEYWORD, TEXT -> SortField.Type.STRING;
            };
            fields.add(new SortField(field.fieldName(), type, reverse));
        }
        // Relevance score as the final tie-breaker, unless the caller already ordered by it.
        if (!hasRelevance) {
            fields.add(SortField.FIELD_SCORE);
        }
        return new Sort(fields.toArray(new SortField[0]));
    }

    /**
     * Builds a relevance-score sort field. For {@link SortField.Type#SCORE} the natural
     * (non-reversed) order is highest-score-first, so {@link SortDirection#DESC} (the default)
     * maps to {@code reverse=false} and {@link SortDirection#ASC} reverses it.
     */
    private SortField relevanceSortField(SortDirection direction) {
        boolean reverse = direction == SortDirection.ASC;
        return new SortField(null, SortField.Type.SCORE, reverse);
    }

    // --- Helpers --------------------------------------------------------------

    private LoadField requireField(String fieldName) {
        if (fieldName == null || fieldName.isBlank()) {
            throw new IllegalArgumentException("Condition is missing a field name");
        }
        return LoadField.byName(fieldName)
                .orElseThrow(() -> new IllegalArgumentException("Unknown searchable field: " + fieldName));
    }

    /**
     * Lowercases a raw term for analysed text fields (or when case-insensitivity is requested) so it
     * lines up with the lowercased tokens produced at index time. Exact-match keyword fields are
     * left untouched unless case-insensitivity is explicitly requested.
     */
    private String normalizeTerm(String fieldName, String value, Boolean caseInsensitive) {
        LoadField field = LoadField.byName(fieldName).orElse(null);
        boolean textField = field != null && field.type() == LoadField.FieldType.TEXT;
        if (textField || Boolean.TRUE.equals(caseInsensitive)) {
            return value.toLowerCase();
        }
        return value;
    }

    /** Runs the configured analyzer over {@code text} for {@code field}, returning the token texts. */
    private List<String> analyze(String field, String text) {
        List<String> tokens = new ArrayList<>();
        try (TokenStream stream = analyzer.tokenStream(field, text)) {
            CharTermAttribute term = stream.addAttribute(CharTermAttribute.class);
            stream.reset();
            while (stream.incrementToken()) {
                tokens.add(term.toString());
            }
            stream.end();
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to analyze term for field " + field, e);
        }
        return tokens;
    }

    /** Parses an ISO-8601 instant ({@code 2026-06-02T08:00:00Z}) or date ({@code 2026-06-02}) to epoch millis. */
    private long parseInstantMillis(String value) {
        try {
            return Instant.parse(value).toEpochMilli();
        } catch (DateTimeParseException ignored) {
            // Fall through to date-only handling.
        }
        try {
            return LocalDate.parse(value).atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli();
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException(
                    "Could not parse date '" + value + "'; expected ISO-8601 instant or yyyy-MM-dd", e);
        }
    }
}
