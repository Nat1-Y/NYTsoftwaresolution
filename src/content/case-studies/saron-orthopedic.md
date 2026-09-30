---
order: 2
name: Saron Orthopedic Center
category: Healthcare ERP & Operations
tagline: High-Throughput Clinical Patient Management ERP
liveUrl: https://api.saronorthopediccenter.com
liveLabel: Staff sign-in
deployment:
  state: production
  checked: 29 Sep 2026
  note: The sign-in page is public; the system behind it is restricted to clinic staff, so there is nothing for a visitor to browse.
overview: >-
  A clinical operations system for an orthopaedic centre in Addis Ababa: patient
  records, appointments, billing and the stock of orthotic and surgical devices,
  in one place and behind role-based access.
challenge: >-
  Check-in was a bottleneck, appointment queues were not tied to physicians'
  schedules, and device inventory had to be accounted for against each
  procedure. Underneath all of it, patient data had to be protected — which in
  practice means knowing who may read a record, and being able to show who did.
solution:
  - Patient records, appointments and billing in a single system.
  - Appointment queues integrated directly with physician schedules.
  - Orthotic and surgical device inventory audited against each procedure.
  - Every endpoint resolves the caller's role before it touches patient data; access is denied by default.
  - An audit row is written for every read of a clinical record.
  - Composite indexes that keep patient-history and billing lookups responsive as records grow.
stack:
  - Node.js
  - Express REST API
  - JWT authentication
  - Role-based access control
  - Append-only audit log
  - Composite database indexes
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
