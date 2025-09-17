// Test file to verify domain model methods work
import com.perundhu.domain.model.*;
import java.time.LocalTime;
import java.util.List;

public class TestDomainMethods {
    public static void main(String[] args) {
        // Test Bus record
        BusId busId = new BusId(1L);
        Bus bus = new Bus(busId, "123", "Test Bus", "KSRTC", "Express", List.of());
        
        System.out.println("Bus methods:");
        System.out.println("id(): " + bus.id());
        System.out.println("name(): " + bus.name());  
        System.out.println("number(): " + bus.number());
        System.out.println("operator(): " + bus.operator());
        System.out.println("type(): " + bus.type());
        
        // Test Stop record
        StopId stopId = new StopId(1L);
        Location.LocationId locationId = new Location.LocationId(1L);
        Location location = new Location(locationId, "Test Location", "Test Tamil", 12.9716, 77.5946);
        Stop stop = new Stop(stopId, "Test Stop", location, LocalTime.of(9, 0), LocalTime.of(9, 5), 1, List.of());
        
        System.out.println("\nStop methods:");
        System.out.println("id(): " + stop.id());
        System.out.println("name(): " + stop.name());
        System.out.println("location(): " + stop.location());
        System.out.println("arrivalTime(): " + stop.arrivalTime());
        System.out.println("departureTime(): " + stop.departureTime());
        System.out.println("sequence(): " + stop.sequence());
        System.out.println("getStopOrder(): " + stop.getStopOrder());
        
        System.out.println("\nLocation methods:");
        System.out.println("name(): " + location.name());
        System.out.println("latitude(): " + location.latitude());
        System.out.println("longitude(): " + location.longitude());
    }
}