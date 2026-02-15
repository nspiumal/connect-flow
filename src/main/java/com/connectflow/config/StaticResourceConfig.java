package com.connectflow.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Slf4j
@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Get the project root directory
        String projectRoot = System.getProperty("user.dir");
        String uploadDirPath = Paths.get(projectRoot, "uploads").toString();

        log.info("Configuring static resources...");
        log.info("Project root: {}", projectRoot);
        log.info("Upload directory: {}", uploadDirPath);

        // Add resource handler for /uploads/** (serves outside of /api context)
        // This is important because application context-path=/api is set in properties
        // So we need to serve uploads at the root level
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadDirPath + "/")
                .setCachePeriod(0)  // No cache for development
                .resourceChain(true)
                .addResolver(new org.springframework.web.servlet.resource.PathResourceResolver());

        log.info("✅ Configured: /uploads/** -> {}", uploadDirPath);
    }
}





