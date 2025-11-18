# Requirements Document

## Introduction

The Security Scan Engine is a core feature of CodeGuardian that analyzes user-submitted code to identify security vulnerabilities. The engine combines static rule-based analysis with LLM-powered security assessment to detect issues, classify their severity, map them to OWASP categories, and generate structured output that enables UI-level code highlighting and remediation guidance.

## Glossary

- **Security Scan Engine**: The system component responsible for analyzing code and detecting security vulnerabilities
- **Static Analyzer**: The subsystem that performs rule-based pattern matching using regex and heuristics
- **LLM Analyzer**: The subsystem that uses a language model to perform contextual security analysis
- **Vulnerability Issue**: A detected security problem in the code with associated metadata (severity, OWASP category, location, description, fix)
- **OWASP Category**: A classification from the OWASP Top 10 or CWE taxonomy
- **Severity Level**: A classification of vulnerability impact (Critical, High, Medium, Low, Info)
- **Code Submission**: User-provided source code to be analyzed
- **Scan Result**: The structured JSON output containing all detected vulnerability issues

## Requirements

### Requirement 1

**User Story:** As a developer, I want to submit my JavaScript/TypeScript code for security analysis, so that I can identify vulnerabilities before deployment

#### Acceptance Criteria

1. WHEN a Code Submission is provided to the Security Scan Engine, THE Security Scan Engine SHALL accept JavaScript source code
2. WHEN a Code Submission is provided to the Security Scan Engine, THE Security Scan Engine SHALL accept TypeScript source code
3. WHEN a Code Submission contains unsupported file types, THE Security Scan Engine SHALL return an error message indicating the unsupported language
4. WHEN a Code Submission is empty or null, THE Security Scan Engine SHALL return an error message indicating invalid input

### Requirement 2

**User Story:** As a developer, I want the system to detect common security vulnerabilities using pattern matching, so that known issues are identified quickly

#### Acceptance Criteria

1. THE Static Analyzer SHALL detect SQL injection vulnerabilities using regex pattern matching
2. THE Static Analyzer SHALL detect cross-site scripting (XSS) vulnerabilities using regex pattern matching
3. THE Static Analyzer SHALL detect hardcoded credentials using regex pattern matching
4. THE Static Analyzer SHALL detect insecure cryptographic functions using heuristic rules
5. WHEN the Static Analyzer detects a vulnerability, THE Static Analyzer SHALL record the line number where the issue occurs
6. WHEN the Static Analyzer detects a vulnerability, THE Static Analyzer SHALL record the column range where the issue occurs

### Requirement 3

**User Story:** As a developer, I want the system to use AI to analyze code context and detect complex vulnerabilities, so that subtle security issues are not missed

#### Acceptance Criteria

1. THE LLM Analyzer SHALL analyze Code Submissions for security vulnerabilities using a language model
2. WHEN the LLM Analyzer detects a vulnerability, THE LLM Analyzer SHALL generate a human-readable explanation of the security issue
3. WHEN the LLM Analyzer detects a vulnerability, THE LLM Analyzer SHALL provide a recommended fix or remediation guidance
4. WHEN the LLM Analyzer detects a vulnerability, THE LLM Analyzer SHALL map the issue to an OWASP category
5. WHEN the LLM Analyzer detects a vulnerability, THE LLM Analyzer SHALL identify the specific line numbers affected

### Requirement 4

**User Story:** As a developer, I want each detected vulnerability to be classified by severity, so that I can prioritize fixes appropriately

#### Acceptance Criteria

1. WHEN a Vulnerability Issue is detected, THE Security Scan Engine SHALL assign a Severity Level of Critical, High, Medium, Low, or Info
2. THE Security Scan Engine SHALL classify SQL injection vulnerabilities as High or Critical severity
3. THE Security Scan Engine SHALL classify XSS vulnerabilities as High or Critical severity
4. THE Security Scan Engine SHALL classify hardcoded credentials as High severity
5. THE Security Scan Engine SHALL classify insecure cryptographic functions as Medium or High severity

### Requirement 5

**User Story:** As a developer, I want vulnerabilities mapped to OWASP categories, so that I understand the type of security risk

#### Acceptance Criteria

1. WHEN a Vulnerability Issue is detected, THE Security Scan Engine SHALL assign an OWASP category identifier
2. THE Security Scan Engine SHALL map SQL injection to OWASP A03:2021 Injection
3. THE Security Scan Engine SHALL map XSS to OWASP A03:2021 Injection
4. THE Security Scan Engine SHALL map hardcoded credentials to OWASP A07:2021 Identification and Authentication Failures
5. THE Security Scan Engine SHALL map insecure cryptography to OWASP A02:2021 Cryptographic Failures

### Requirement 6

**User Story:** As a frontend developer, I want scan results in structured JSON format, so that I can display issues with line-level highlighting in the UI

#### Acceptance Criteria

1. WHEN a scan completes, THE Security Scan Engine SHALL return a Scan Result in JSON format
2. THE Scan Result SHALL contain an array of Vulnerability Issues
3. WHEN a Vulnerability Issue is included in the Scan Result, THE Security Scan Engine SHALL include the issue title
4. WHEN a Vulnerability Issue is included in the Scan Result, THE Security Scan Engine SHALL include the issue description
5. WHEN a Vulnerability Issue is included in the Scan Result, THE Security Scan Engine SHALL include the Severity Level
6. WHEN a Vulnerability Issue is included in the Scan Result, THE Security Scan Engine SHALL include the OWASP category
7. WHEN a Vulnerability Issue is included in the Scan Result, THE Security Scan Engine SHALL include the line number
8. WHEN a Vulnerability Issue is included in the Scan Result, THE Security Scan Engine SHALL include the column start position
9. WHEN a Vulnerability Issue is included in the Scan Result, THE Security Scan Engine SHALL include the column end position
10. WHEN a Vulnerability Issue is included in the Scan Result, THE Security Scan Engine SHALL include the recommended fix

### Requirement 7

**User Story:** As a developer, I want the scan engine to combine results from both static and LLM analysis, so that I get comprehensive vulnerability detection

#### Acceptance Criteria

1. WHEN a Code Submission is analyzed, THE Security Scan Engine SHALL execute the Static Analyzer
2. WHEN a Code Submission is analyzed, THE Security Scan Engine SHALL execute the LLM Analyzer
3. WHEN both analyzers complete, THE Security Scan Engine SHALL merge results from the Static Analyzer and LLM Analyzer
4. WHEN duplicate vulnerabilities are detected by both analyzers, THE Security Scan Engine SHALL deduplicate issues based on line number and issue type
5. THE Security Scan Engine SHALL return the merged Scan Result containing all unique Vulnerability Issues

### Requirement 8

**User Story:** As a system administrator, I want the scan engine to handle errors gracefully, so that the system remains stable when analysis fails

#### Acceptance Criteria

1. IF the Static Analyzer encounters a parsing error, THEN THE Security Scan Engine SHALL log the error and continue with LLM analysis
2. IF the LLM Analyzer fails to respond within a timeout period, THEN THE Security Scan Engine SHALL return results from the Static Analyzer only
3. IF both analyzers fail, THEN THE Security Scan Engine SHALL return an error message with failure details
4. WHEN an error occurs during scanning, THE Security Scan Engine SHALL include error information in the Scan Result
