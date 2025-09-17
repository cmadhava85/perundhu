package com.perundhu.integration;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import com.perundhu.application.dto.BusScheduleDTO;
import com.perundhu.application.dto.StopDTO;

@ExtendWith(MockitoExtension.class)
class BusScheduleIntegrationTest {

        @Test
        void testBusScheduleDTOCreation() {
                // Test basic DTO creation
                BusScheduleDTO schedule = new BusScheduleDTO(
                                1L,
                                "Test Schedule",
                                "Test Schedule Tamil",
                                "B001",
                                "From Location",
                                "From Location Tamil",
                                "To Location",
                                "To Location Tamil",
                                LocalTime.of(8, 0),
                                LocalTime.of(10, 0));

                assertNotNull(schedule);
                assertEquals(1L, schedule.id());
                assertEquals("Test Schedule", schedule.name());
                assertEquals("B001", schedule.busNumber());
        }

        @Test
        void testStopDTOCreation() {
                // Test basic DTO creation with minimal features
                StopDTO stop = new StopDTO(
                                1L,
                                "Test Stop",
                                100L,
                                LocalTime.of(8, 30),
                                LocalTime.of(8, 32),
                                1,
                                Map.of("type", "regular"));

                assertNotNull(stop);
                assertEquals(1L, stop.id());
                assertEquals("Test Stop", stop.name());
                assertEquals(100L, stop.locationId());
        }
}
