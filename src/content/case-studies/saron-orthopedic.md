---
order: 2
name: Saron Orthopedic Center
category: Healthcare ERP & Operations
tagline: High-Throughput Clinical Patient Management ERP
liveUrl: https://api.saronorthopediccenter.com
liveLabel: Platform Endpoint
status:
  label: Status
  value: Production Active
  variant: online
business:
  metric:
    value: 60%
    description: Reduction in patient check-in bottlenecks
    source: Measured against the clinic's pre-rollout intake timings.
  bullets:
    - title: Medical data protection
      text: Patient diagnostic logs and histories are encrypted at rest and in transit.
    - title: Staff coordination
      text: Integrates appointment queues directly with physician schedules.
    - title: Surgical device tracking
      text: Audits orthotic and hardware device inventory against each procedure.
tech:
  specs:
    - label: API Layer
      value: Node.js / Express REST with strict CORS and JWT auth
    - label: Access Control
      value: Granular role-based access control (RBAC)
    - label: Database Strategy
      value: Composite indexing over 100k+ historical clinic records
  narrative: >-
    Designed around least-privilege access. Every endpoint resolves the caller's
    role before touching patient data, and audit rows are written for each read
    of a clinical record. Composite indexes keep patient-history and billing
    lookups responsive as the record count grows.
  diagram: clinical
plain: >-
  A clinic where we built a system to manage all patient records, appointments
  and billing in one place.
---

Healthcare work is mostly **access control and auditability**, not raw
throughput. The schema was built so that "who read this record, and when" is a
first-class query rather than something reconstructed from logs after the fact.
