package kmp.ct07.scholarhub.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class MaterialUpdateDTO {
    @JsonProperty("title")
    private String title;

    @JsonProperty("description")
    private String description;
}
