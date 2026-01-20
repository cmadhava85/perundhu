package com.perundhu.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.perundhu.domain.model.BusTerminal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TerminalInfoDTO {
    @NotBlank(message = "Terminal ID is required")
    @Size(max = 100, message = "Terminal ID must not exceed 100 characters")
    private String terminalId;

    @NotBlank(message = "Terminal name is required")
    @Size(max = 200, message = "Terminal name must not exceed 200 characters")
    private String terminalName;

    @NotBlank(message = "Display name is required")
    @Size(max = 200, message = "Display name must not exceed 200 characters")
    private String displayName;

    @Size(max = 500, message = "Address must not exceed 500 characters")
    private String address;

    private Double latitude;
    private Double longitude;

    @Size(max = 1000, message = "Message must not exceed 1000 characters")
    private String message;

    private boolean isDifferentFromSearched;

    public static TerminalInfoDTO fromBusTerminal(BusTerminal terminal, String message) {
        return TerminalInfoDTO.builder()
                .terminalId(terminal.getTerminalId())
                .terminalName(terminal.getName())
                .displayName(terminal.getDisplayName())
                .address(terminal.getAddress())
                .latitude(terminal.getLatitude())
                .longitude(terminal.getLongitude())
                .message(message)
                .isDifferentFromSearched(true)
                .build();
    }
}
