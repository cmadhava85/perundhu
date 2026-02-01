-- Add unique indexes to prevent duplicate inserts from bulk uploads

CREATE UNIQUE INDEX uq_locations_name_district_state
    ON locations (name, district, state);

CREATE UNIQUE INDEX uq_buses_bus_number_route_time
    ON buses (bus_number, from_location_id, to_location_id, departure_time, arrival_time);

CREATE UNIQUE INDEX uq_stops_bus_order
    ON stops (bus_id, stop_order);
