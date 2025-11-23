package com.perundhu;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {
        "com.perundhu.application",
        "com.perundhu.adapter",
        "com.perundhu.infrastructure",
        "com.perundhu.config",
        "com.perundhu.domain",
        "com.perundhu.api"
})
public class App {
    public static void main(String[] args) {
        SpringApplication.run(App.class, args);
    }
}
