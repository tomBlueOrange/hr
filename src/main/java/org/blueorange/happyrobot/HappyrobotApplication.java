package org.blueorange.happyrobot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"org.blueorange.happyrobot", "com.blueorange.passportsdk", "com.blueorange.commons"})
public class HappyrobotApplication {

    public static void main(String[] args) {
        SpringApplication.run(HappyrobotApplication.class, args);
    }

}
