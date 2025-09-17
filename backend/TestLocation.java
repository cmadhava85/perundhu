// Quick test to check Location constructor
import com.perundhu.domain.model.Location;

public class TestLocation {
    public static void main(String[] args) {
        // Try different constructor combinations
        Location loc1 = new Location(new LocationId(1L), "Test", "", 13.0, 80.0);
        System.out.println("Success");
    }
}