package com.perundhu.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.*;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.lang.ArchRule;

/**
 * Automated tests to validate hexagonal architecture rules.
 * These tests will fail if architecture violations are introduced.
 */
public class HexagonalArchitectureTest {

  private static JavaClasses importedClasses;

  @BeforeAll
  static void setup() {
    importedClasses = new ClassFileImporter().importPackages("com.perundhu");
  }

  @Test
  void domainLayerShouldNotDependOnApplicationLayer() {
    ArchRule rule = noClasses()
        .that().resideInAPackage("..domain..")
        .should().dependOnClassesThat().resideInAPackage("..application..");

    rule.check(importedClasses);
  }

  @Test
  void domainLayerShouldNotDependOnInfrastructureLayer() {
    ArchRule rule = noClasses()
        .that().resideInAPackage("..domain..")
        .should().dependOnClassesThat().resideInAPackage("..infrastructure..");

    rule.check(importedClasses);
  }

  @Test
  void applicationLayerShouldNotDependOnInfrastructureLayer() {
    ArchRule rule = noClasses()
        .that().resideInAPackage("..application..")
        .should().dependOnClassesThat().resideInAPackage("..infrastructure..");

    rule.check(importedClasses);
  }

  @Test
  void applicationLayerShouldOnlyDependOnDomainLayer() {
    ArchRule rule = classes()
        .that().resideInAPackage("..application..")
        .should().onlyDependOnClassesThat().resideInAnyPackage(
            "..domain..",
            "java..",
            "org.springframework..",
            "org.slf4j..",
            "lombok..");

    rule.check(importedClasses);
  }

  @Test
  void domainModelsShouldNotUseFrameworkAnnotations() {
    ArchRule rule = noClasses()
        .that().resideInAPackage("..domain.model..")
        .should().beAnnotatedWith("org.springframework.stereotype.Component")
        .orShould().beAnnotatedWith("org.springframework.stereotype.Service")
        .orShould().beAnnotatedWith("org.springframework.stereotype.Repository")
        .orShould().beAnnotatedWith("jakarta.persistence.Entity")
        .orShould().beAnnotatedWith("javax.persistence.Entity");

    rule.check(importedClasses);
  }

  @Test
  void repositoriesShouldBeInterfaces() {
    ArchRule rule = classes()
        .that().haveSimpleNameEndingWith("Repository")
        .and().resideInAPackage("..domain.port..")
        .should().beInterfaces();

    rule.check(importedClasses);
  }

  @Test
  void outputPortsShouldBeInterfaces() {
    ArchRule rule = classes()
        .that().haveSimpleNameEndingWith("OutputPort")
        .and().resideInAPackage("..domain.port..")
        .should().beInterfaces();

    rule.check(importedClasses);
  }

  @Test
  void inputPortsShouldBeInterfaces() {
    ArchRule rule = classes()
        .that().haveSimpleNameEndingWith("InputPort")
        .or().haveSimpleNameEndingWith("UseCase")
        .and().resideInAPackage("..application.port.input..")
        .should().beInterfaces();

    rule.check(importedClasses);
  }

  @Test
  void adaptersShouldImplementDomainPorts() {
    ArchRule rule = classes()
        .that().resideInAPackage("..infrastructure.adapter..")
        .and().haveSimpleNameEndingWith("Adapter")
        .should().implement("..domain.port..");

    rule.check(importedClasses);
  }

  @Test
  void controllersShouldNotContainBusinessLogic() {
    // Controllers should not contain business logic - they should delegate to
    // application services
    ArchRule rule = noClasses()
        .that().resideInAPackage("..infrastructure.adapter.in.web..")
        .and().haveSimpleNameEndingWith("Controller")
        .should().haveNameMatching(".*calculate.*|.*compute.*|.*validate.*|.*process.*")
        .because("Controllers should delegate business logic to application services");

    rule.check(importedClasses);
  }

  @Test
  void layeredArchitectureShouldBeRespected() {
    ArchRule rule = layeredArchitecture()
        .consideringAllDependencies()
        .layer("Domain").definedBy("..domain..")
        .layer("Application").definedBy("..application..")
        .layer("Infrastructure").definedBy("..infrastructure..")

        .whereLayer("Domain").mayNotAccessAnyLayer()
        .whereLayer("Application").mayOnlyAccessLayers("Domain")
        .whereLayer("Infrastructure").mayOnlyAccessLayers("Application", "Domain", "Infrastructure");

    rule.check(importedClasses);
  }

  @Test
  void configurationShouldOnlyBeInInfrastructureLayer() {
    ArchRule rule = classes()
        .that().areAnnotatedWith("org.springframework.context.annotation.Configuration")
        .should().resideInAPackage("..infrastructure.config..");

    rule.check(importedClasses);
  }

  @Test
  void entitiesShouldOnlyBeInInfrastructureLayer() {
    ArchRule rule = classes()
        .that().areAnnotatedWith("jakarta.persistence.Entity")
        .or().areAnnotatedWith("javax.persistence.Entity")
        .should().resideInAPackage("..infrastructure.persistence.entity..");

    rule.check(importedClasses);
  }

  @Test
  void domainServicesShouldBeInterfaces() {
    ArchRule rule = classes()
        .that().resideInAPackage("..domain.service..")
        .should().beInterfaces()
        .because("Domain services should be interfaces implemented in infrastructure layer");

    rule.check(importedClasses);
  }

  @Test
  void applicationServicesShouldNotBeDirectlyAnnotatedAsComponents() {
    // Application services should be discovered through configuration, not direct
    // annotation
    ArchRule rule = noClasses()
        .that().resideInAPackage("..application.service..")
        .should().beAnnotatedWith("org.springframework.stereotype.Component")
        .because("Application services should be configured in infrastructure layer");

    // Note: @Service annotation might be acceptable if used consistently
    rule.check(importedClasses);
  }
}