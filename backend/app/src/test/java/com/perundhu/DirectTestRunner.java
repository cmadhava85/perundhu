package com.perundhu;

import org.junit.platform.launcher.Launcher;
import org.junit.platform.launcher.LauncherDiscoveryRequest;
import org.junit.platform.launcher.core.LauncherDiscoveryRequestBuilder;
import org.junit.platform.launcher.core.LauncherFactory;
import org.junit.platform.launcher.listeners.SummaryGeneratingListener;
import org.junit.platform.launcher.listeners.TestExecutionSummary;
import org.junit.platform.launcher.TestExecutionListener;
import org.junit.platform.launcher.listeners.LoggingListener;
import org.junit.platform.engine.discovery.DiscoverySelectors;
import java.util.logging.Logger;
import java.util.logging.Level;
import java.util.logging.LogManager;
import java.util.logging.ConsoleHandler;
import java.io.PrintWriter;

import com.perundhu.integration.BusScheduleIntegrationTest;

/**
 * A direct JUnit test runner to diagnose test failures
 * without relying on Gradle's test infrastructure
 */
public class DirectTestRunner {

    public static void main(String[] args) {
        // Set up logging
        setupLogging();
        
        // Create a listener for test execution results
        SummaryGeneratingListener listener = new SummaryGeneratingListener();
        
        // Configure the launcher to run BusScheduleIntegrationTest which we know exists
        LauncherDiscoveryRequest request = LauncherDiscoveryRequestBuilder.request()
                .selectors(DiscoverySelectors.selectClass(BusScheduleIntegrationTest.class))
                .build();
        
        // Run the test
        Launcher launcher = LauncherFactory.create();
        launcher.registerTestExecutionListeners(listener);
        launcher.execute(request);
        
        // Print summary
        TestExecutionSummary summary = listener.getSummary();
        summary.printTo(new PrintWriter(System.out));
        
        // Print any failures in detail
        summary.getFailures().forEach(failure -> {
            System.out.println("\nDetailed failure information:");
            System.out.println("Test: " + failure.getTestIdentifier().getDisplayName());
            System.out.println("Exception: " + failure.getException());
            failure.getException().printStackTrace();
        });
    }
    
    private static void setupLogging() {
        LogManager.getLogManager().reset();
        Logger rootLogger = Logger.getLogger("");
        ConsoleHandler handler = new ConsoleHandler();
        handler.setLevel(Level.FINE);
        rootLogger.addHandler(handler);
        rootLogger.setLevel(Level.FINE);
    }
}