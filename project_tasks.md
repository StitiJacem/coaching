# Tunisia Health & Fitness Ecosystem - Roadmap

> **Workflow Rule:** I will pause after each major checkmark. You say "Next" to proceed.

## 🛑 STAGE 1: FOUNDATION & DESIGN (Current)
We are solidifying the business rules.
- [x] **Core Architecture**: ERD & Actor Matrix.
- [x] **Coach Logic**: Specialization & Discovery Design (`COACH_SPECIALIZATION_DESIGN.md`).
- [/] **Data Schema**: Update DB with `specializations` and `program_templates`. <!-- id: 101 -->
    - [x] Create Entities: `CoachProfile`, `CoachSpecialization`, `CoachCertification`.
    - [x] Update Entity: `Program` (templates & specializations).
    - [x] Register Entities in `data-source.ts` (Fixes backend crash).

## 🛑 STAGE 2: BACKEND IMPLEMENTATION (Next)
- [x] **Auth Module**: Update Coach Registration to accept Specializations. <!-- id: 102 -->
- [/] **Profile Module**: Add verification & certification upload. <!-- id: 103 -->
- [x] **Program Module**: Implement `is_template` and `assignTo` logic (Frontend Builder ready). <!-- id: 104 -->
- [/] **Discovery Module**: Create "Find Coach" search API & UI. <!-- id: 105 -->

## 🛑 STAGE 3: FRONTEND (Web & Mobile)
- [x] **Coach Dashboard**: Program Builder & Template Library.
- [/] **Athlete App**: "Find a Coach" Marketplace.
