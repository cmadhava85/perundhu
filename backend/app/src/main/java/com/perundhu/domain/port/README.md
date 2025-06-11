# Domain Ports

This package contains all the interfaces (ports) that define how the domain interacts with the outside world.

## Structure

- **Input Ports**: Interfaces that allow external components to interact with the domain
- **Output Ports**: Interfaces that allow the domain to interact with external resources

According to hexagonal architecture principles, all data access interfaces (repositories) should be defined here as output ports, while service interfaces should be defined here as input ports.

The actual implementations should be in the adapter layers (inbound and outbound adapters).
