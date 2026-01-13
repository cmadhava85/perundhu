package com.perundhu.application.dto;

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
    private String terminalId;
    private String terminalName;
    private String displayName;
    private String address;
    private Double latitude;
    private Double longitude;
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
