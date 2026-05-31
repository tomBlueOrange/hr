package org.blueorange.happyrobot.services;

import com.blueorange.commons.config.OrangeLogger;
import com.blueorange.commons.config.SafeLogParam;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.blueorange.happyrobot.entities.Dimension;
import org.blueorange.happyrobot.entities.Load;
import org.blueorange.happyrobot.search.LoadField;
import org.blueorange.happyrobot.search.LuceneQueryTranslator;
import org.blueorange.happyrobot.search.Query;
import org.blueorange.happyrobot.search.QueryCondition;
import org.blueorange.happyrobot.search.QueryFullTextCondition;
import org.blueorange.happyrobot.search.QueryResponse;
import org.apache.lucene.analysis.standard.StandardAnalyzer;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.DoubleDocValuesField;
import org.apache.lucene.document.DoublePoint;
import org.apache.lucene.document.Field;
import org.apache.lucene.document.IntPoint;
import org.apache.lucene.document.LongPoint;
import org.apache.lucene.document.NumericDocValuesField;
import org.apache.lucene.document.SortedDocValuesField;
import org.apache.lucene.document.StoredField;
import org.apache.lucene.document.StringField;
import org.apache.lucene.document.TextField;
import org.apache.lucene.index.DirectoryReader;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.ScoreDoc;
import org.apache.lucene.search.TopDocs;
import org.apache.lucene.store.ByteBuffersDirectory;
import org.apache.lucene.store.Directory;
import org.apache.lucene.util.BytesRef;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import jakarta.annotation.PreDestroy;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Loads the dummy load data from the classpath at startup and builds an embedded,
 * in-memory Apache Lucene index that the rest of the application can search.
 *
 * <p>Indexing runs asynchronously once the Spring context is ready. Until the index
 * has been fully committed {@link #isReady()} returns {@code false} and searches return
 * no results; {@link #getDocumentsIndexed()} reports how many documents were committed.
 */
@Service
public class LoadSearchService {

    private static final OrangeLogger logger = new OrangeLogger(LoadSearchService.class);

    /** Lucene fields searched by free-text queries when no explicit field is given. */
    private static final String[] DEFAULT_SEARCH_FIELDS = {
            "startingLocation", "deliveryLocation", "equipmentType", "commodityType", "notes"
    };

    private final ObjectMapper objectMapper;
    private final Resource loadData;

    private final Directory directory = new ByteBuffersDirectory();
    private final StandardAnalyzer analyzer = new StandardAnalyzer();
    private final LuceneQueryTranslator translator =
            new LuceneQueryTranslator(analyzer, DEFAULT_SEARCH_FIELDS);

    private volatile boolean ready = false;
    private final AtomicInteger documentsIndexed = new AtomicInteger(0);

    @Autowired
    public LoadSearchService(
            ObjectMapper objectMapper,
            @Value("${application.fde-interview.load-data:classpath:data/dummy_load_data.json}") Resource loadData
    ) {
        this.objectMapper = objectMapper;
        this.loadData = loadData;
        logger.info("LoadSearchService initialised; index not yet built");
    }

    /**
     * Kicks off the index build once the application context is fully started. The build
     * runs on a dedicated thread so it does not block application startup; until it
     * completes the service simply reports that it is not yet ready.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void buildIndexOnStartup() {
        Thread indexer = new Thread(this::buildIndex, "load-index-builder");
        indexer.setDaemon(true);
        logger.info("Application ready; scheduling load index build on thread {}",
                SafeLogParam.of(indexer.getName()));
        indexer.start();
    }

    /**
     * Reads the dummy load data and writes one Lucene document per load. Text fields are
     * analysed for free-text search; numeric and date fields are indexed as points for
     * range queries; every field is also stored so full {@link Load} records can be
     * reconstructed from search hits.
     */
    void buildIndex() {
        long started = System.currentTimeMillis();
        logger.info("Starting load index build from resource {}",
                SafeLogParam.of(describeResource()));
        try {
            List<Load> loads = readLoads();
            logger.info("Read {} load(s) from dummy data; beginning indexing",
                    SafeLogParam.of(loads.size()));

            IndexWriterConfig config = new IndexWriterConfig(analyzer);
            config.setOpenMode(IndexWriterConfig.OpenMode.CREATE);

            int indexed = 0;
            try (IndexWriter writer = new IndexWriter(directory, config)) {
                for (Load load : loads) {
                    writer.addDocument(toDocument(load));
                    indexed++;
                    logger.debug("Indexed load {} ({} -> {})",
                            SafeLogParam.of(load.getLoadId()),
                            SafeLogParam.of(load.getStartingLocation()),
                            SafeLogParam.of(load.getDeliveryLocation()));
                }
                writer.commit();
            }

            documentsIndexed.set(indexed);
            ready = true;
            logger.info("Load index build complete: {} document(s) indexed in {} ms",
                    SafeLogParam.of(indexed),
                    SafeLogParam.of(System.currentTimeMillis() - started));
        } catch (Exception e) {
            ready = false;
            logger.error(e, "Failed to build load index from resource {}",
                    SafeLogParam.of(describeResource()));
        }
    }

    private List<Load> readLoads() throws IOException {
        try (InputStream in = loadData.getInputStream()) {
            List<Load> loads = objectMapper.readValue(
                    in,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Load.class)
            );
            return loads == null ? new ArrayList<>() : loads;
        }
    }

    private Document toDocument(Load load) {
        Document doc = new Document();

        // Identifier: exact-match keyword, stored for reconstruction.
        addKeyword(doc, "loadId", load.getLoadId());

        // Analysed text fields used for free-text matching, also stored.
        addText(doc, "startingLocation", load.getStartingLocation());
        addText(doc, "deliveryLocation", load.getDeliveryLocation());
        addText(doc, "equipmentType", load.getEquipmentType());
        addText(doc, "notes", load.getNotes());
        if (load.getCommodityType() != null) {
            for (String commodity : load.getCommodityType()) {
                addText(doc, "commodityType", commodity);
            }
        }

        // Numeric fields: indexed as points for range search, stored for reconstruction.
        addDouble(doc, "loadboardRate", load.getLoadboardRate());
        addDouble(doc, "weight", load.getWeight());
        addDouble(doc, "miles", load.getMiles());
        addInt(doc, "numOfPieces", load.getNumOfPieces());

        // Dates stored as epoch millis (indexed as long points for range search).
        addDate(doc, "pickupDateTime", load.getPickupDateTime());
        addDate(doc, "deliveryDateTime", load.getDeliveryDateTime());

        // Dimensions: stored only (used when reconstructing the record).
        if (load.getDimensions() != null) {
            addInt(doc, "dimHeight", load.getDimensions().getHeight());
            addInt(doc, "dimWidth", load.getDimensions().getWidth());
            addInt(doc, "dimLength", load.getDimensions().getLength());
        }

        return doc;
    }

    /**
     * Runs a free-text query across the default load fields and returns the matching
     * loads, highest scoring first. Returns an empty list if the index is not yet ready.
     *
     * <p>This is a convenience wrapper over {@link #search(Query)}: the string is treated as a
     * single full-text condition over {@link #DEFAULT_SEARCH_FIELDS}. For granular control over
     * boolean structure, ranges and sorting, build a {@link Query} and call {@link #search(Query)}.
     *
     * @param queryString a Lucene query string (e.g. {@code "Dallas reefer"})
     * @param maxResults  maximum number of loads to return
     */
    public List<Load> search(String queryString, int maxResults) {
        if (queryString == null || queryString.isBlank()) {
            return new ArrayList<>();
        }
        Query query = new Query(QueryCondition.fullText(new QueryFullTextCondition(queryString, null)));
        query.setPage(0);
        query.setSize(Math.max(1, maxResults));
        return search(query).getResults();
    }

    /**
     * Executes a granular {@link Query} against the index and returns a {@link QueryResponse}
     * carrying the requested page of loads, the total match count, the echoed pagination and the
     * search duration. Never throws: a not-ready index or an invalid query yields a
     * {@link org.blueorange.happyrobot.search.ResponseState#ERROR} response.
     *
     * @param query the query tree, pagination and sort to execute (must not be {@code null})
     */
    public QueryResponse search(Query query) {
        long started = System.currentTimeMillis();
        int page = Math.max(0, query.getPage());
        int size = Math.max(0, query.getSize());

        if (!ready) {
            logger.warn("Search requested but index is not ready yet; returning no results");
            return QueryResponse.error("Search index is not ready yet", page, size,
                    System.currentTimeMillis() - started);
        }

        try (DirectoryReader reader = DirectoryReader.open(directory)) {
            IndexSearcher searcher = new IndexSearcher(reader);
            LuceneQueryTranslator.Translated translated = translator.translate(query);

            long total = searcher.count(translated.query());
            // Fetch enough top hits to cover the requested page, then slice it out.
            int needed = Math.max(1, (page + 1) * size);
            TopDocs topDocs = translated.sort() == null
                    ? searcher.search(translated.query(), needed)
                    : searcher.search(translated.query(), needed, translated.sort(), true);

            List<Load> results = new ArrayList<>();
            ScoreDoc[] hits = topDocs.scoreDocs;
            for (int i = page * size; i < hits.length && i < (page * size) + size; i++) {
                results.add(fromDocument(searcher.doc(hits[i].doc)));
            }

            long duration = System.currentTimeMillis() - started;
            logger.info("Query matched {} load(s); returning page {} (size {}) in {} ms",
                    SafeLogParam.of(total), SafeLogParam.of(page),
                    SafeLogParam.of(size), SafeLogParam.of(duration));
            return QueryResponse.success(results, total, page, size, duration);
        } catch (IllegalArgumentException e) {
            // A malformed query (unknown field, bad date, etc.) is a caller error, not a server fault.
            logger.warn(e, "Rejected invalid load query");
            return QueryResponse.error(e.getMessage(), page, size, System.currentTimeMillis() - started);
        } catch (Exception e) {
            logger.error(e, "Failed to execute load search");
            return QueryResponse.error("Failed to execute search: " + e.getMessage(), page, size,
                    System.currentTimeMillis() - started);
        }
    }

    private Load fromDocument(Document doc) {
        Load load = new Load();
        load.setLoadId(doc.get("loadId"));
        load.setStartingLocation(doc.get("startingLocation"));
        load.setDeliveryLocation(doc.get("deliveryLocation"));
        load.setEquipmentType(doc.get("equipmentType"));
        load.setNotes(doc.get("notes"));

        String[] commodities = doc.getValues("commodityType");
        if (commodities.length > 0) {
            load.setCommodityType(new ArrayList<>(List.of(commodities)));
        }

        load.setLoadboardRate(getDouble(doc, "loadboardRate"));
        load.setWeight(getDouble(doc, "weight"));
        load.setMiles(getDouble(doc, "miles"));
        load.setNumOfPieces(getInt(doc, "numOfPieces"));
        load.setPickupDateTime(getDate(doc, "pickupDateTime"));
        load.setDeliveryDateTime(getDate(doc, "deliveryDateTime"));

        Integer h = getInt(doc, "dimHeight");
        Integer w = getInt(doc, "dimWidth");
        Integer l = getInt(doc, "dimLength");
        if (h != null || w != null || l != null) {
            load.setDimensions(new Dimension(h, w, l));
        }
        return load;
    }

    /** @return {@code true} once the index has been fully built and is ready to serve searches. */
    public boolean isReady() {
        return ready;
    }

    /** @return number of documents successfully committed to the index. */
    public int getDocumentsIndexed() {
        return documentsIndexed.get();
    }

    @PreDestroy
    void close() {
        try {
            directory.close();
            analyzer.close();
            logger.info("Closed Lucene resources for load index");
        } catch (IOException e) {
            logger.warn(e, "Error closing Lucene directory");
        }
    }

    // --- Lucene field helpers -------------------------------------------------

    private void addKeyword(Document doc, String name, String value) {
        if (value != null) {
            doc.add(new StringField(name, value, Field.Store.YES));
            if (isSortable(name)) {
                doc.add(new SortedDocValuesField(name, new BytesRef(value)));
            }
        }
    }

    private void addText(Document doc, String name, String value) {
        if (value != null) {
            doc.add(new TextField(name, value, Field.Store.YES));
            // Doc-values back string sorting using the original (un-analysed) value. Only added for
            // single-valued sortable fields; multi-valued fields (e.g. commodityType) are not sortable.
            if (isSortable(name)) {
                doc.add(new SortedDocValuesField(name, new BytesRef(value)));
            }
        }
    }

    private void addDouble(Document doc, String name, Double value) {
        if (value != null) {
            doc.add(new DoublePoint(name, value));
            doc.add(new StoredField(name, value));
            if (isSortable(name)) {
                doc.add(new DoubleDocValuesField(name, value));
            }
        }
    }

    private void addInt(Document doc, String name, Integer value) {
        if (value != null) {
            doc.add(new IntPoint(name, value));
            doc.add(new StoredField(name, value));
            if (isSortable(name)) {
                doc.add(new NumericDocValuesField(name, value));
            }
        }
    }

    private void addDate(Document doc, String name, Date value) {
        if (value != null) {
            doc.add(new LongPoint(name, value.getTime()));
            doc.add(new StoredField(name, value.getTime()));
            if (isSortable(name)) {
                doc.add(new NumericDocValuesField(name, value.getTime()));
            }
        }
    }

    /** @return whether the schema marks this field as sortable, so doc-values should be written. */
    private boolean isSortable(String name) {
        return LoadField.byName(name).map(LoadField::sortable).orElse(false);
    }

    private Double getDouble(Document doc, String name) {
        Number n = numeric(doc, name);
        return n == null ? null : n.doubleValue();
    }

    private Integer getInt(Document doc, String name) {
        Number n = numeric(doc, name);
        return n == null ? null : n.intValue();
    }

    private Date getDate(Document doc, String name) {
        Number n = numeric(doc, name);
        return n == null ? null : new Date(n.longValue());
    }

    private Number numeric(Document doc, String name) {
        Field field = (Field) doc.getField(name);
        return field == null ? null : field.numericValue();
    }

    private String describeResource() {
        try {
            return loadData.getDescription();
        } catch (Exception e) {
            return String.valueOf(loadData);
        }
    }
}
