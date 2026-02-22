package com.connectflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemDetailDTO {
    private String description;
    private String content;
    private String condition;
    private BigDecimal weightGrams;
    private Integer karat;
    private BigDecimal appraisedValue;

    @Builder.Default
    private List<String> images = new ArrayList<>(); // Image URLs/base64 strings
}

