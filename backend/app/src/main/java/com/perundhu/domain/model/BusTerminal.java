package com.perundhu.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusTerminal {
    private String terminalId;
    private String name;
    private String city;
    private String displayName;
    private Double latitude;
    private Double longitude;
    private String address;
    private List<String> servesStates;
    private List<String> servesDistricts;
    private List<String> majorDestinations;
    private TerminalType terminalType;
    private String operatedBy; // CMDA, TNSTC, etc.
    
    public enum TerminalType {
        INTER_STATE,
        INTRA_STATE,
        SUBURBAN,
        METRO
    }
}
