/**
 * Example demonstrating the modernized BusLocationRequest record usage
 */
public class BusLocationRequestExample {

  public static void main(String[] args) {
    // Creating a BusLocationRequest using the record constructor
    var request = new BusTrackingService.BusLocationRequest(
        1L, // busId
        "user123", // userId
        13.0827, // latitude
        80.2707, // longitude
        10.0, // accuracy
        45.0, // speed
        90.0, // heading
        "2024-09-15T10:30:00", // timestamp
        null, // stopId (auto-detected)
        "Android Device" // deviceInfo
    );

    // Using modern record accessor methods (recommended)
    System.out.println("Bus ID: " + request.busId());
    System.out.println("User ID: " + request.userId());
    System.out.println("Location: " + request.latitude() + ", " + request.longitude());
    System.out.println("Timestamp: " + request.timestamp());

    // Legacy getter methods (deprecated, will be removed)
    System.out.println("Legacy Bus ID: " + request.getBusId());
    System.out.println("Legacy User ID: " + request.getUserId());

    // Using convenience constructor
    var simpleRequest = new BusTrackingService.BusLocationRequest(
        1L, // busId
        "user123", // userId
        13.0827, // latitude
        80.2707 // longitude
    );

    System.out.println("Simple request created with default values for optional fields");

    // Records provide automatic equals, hashCode, and toString
    System.out.println("Request: " + request);
    System.out.println("Requests equal: " + request.equals(simpleRequest));
  }
}