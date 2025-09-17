// Test file to check Bus methods
import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusId;
import java.util.List;

public class TestBusMethods {
    public static void main(String[] args) {
        BusId busId = new BusId(1L);
        Bus bus = new Bus(busId, "123", "Test Bus", "KSRTC", "Express", List.of());
        
        // Test record-style methods
        System.out.println("id(): " + bus.id());
        System.out.println("name(): " + bus.name());
        System.out.println("number(): " + bus.number());
    }
}