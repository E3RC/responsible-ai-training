# Module 4 — AI in Engineering and Robotics

**Estimated time:** 15–18 minutes  
**E3RC principles:** VERIFY, OWN IT  
**FIRST connection:** Innovation, Discovery, safety, high-quality work

## Learning goals

Students should be able to:

- use AI productively in software, CAD, electrical, strategy, and documentation;
- identify when AI-generated technical work requires stronger human review;
- explain why compilation, simulation, or one successful test does not prove safety;
- keep accountable human ownership of robot behavior.

## AI is an engineering accelerator

AI tools can help Team 1555 students:

- explain unfamiliar code;
- generate test cases;
- suggest refactors;
- compare design options;
- summarize datasheets;
- draft documentation;
- analyze scouting data;
- create simulation ideas;
- brainstorm autonomous routines;
- explain control theory, kinematics, and sensor behavior;
- assist with CAD concepts and fabrication planning.

That can be extremely powerful. The ethical issue is not whether the tool was used. The issue is whether the team understands, verifies, and safely owns the result.

## “It compiles” is not the same as “it is correct”

Suppose an AI coding agent rewrites a drivetrain subsystem. The project compiles and the robot moves.

That still does not prove:

- motor directions are correct in every mode;
- current limits are safe;
- emergency behavior is correct;
- sensor units are right;
- limits and interlocks work;
- edge cases are handled;
- stale or incorrect APIs were not used;
- the robot will behave safely when communication drops or a sensor fails.

A safe engineering workflow includes review, controlled testing, logging, limits, and the ability for a human to explain critical behavior.

## Risk-based review

Not every AI output needs the same scrutiny.

### Lower consequence

- renaming variables;
- drafting comments;
- formatting documentation;
- generating a practice quiz.

### Medium consequence

- scouting calculations;
- path-planning code;
- mechanism geometry;
- wiring recommendations;
- vendor configuration values.

### High consequence

- motion near people;
- high-current electrical design;
- pneumatic or mechanical safety;
- automatic movement;
- code that can cause a mechanism to collide;
- anything affecting inspection legality or field safety.

The higher the consequence, the more independent verification and human review is required.

## “Ask the AI if it is safe” is not a safety review

AI can help create a checklist, identify possible failure modes, or explain a datasheet. But it should not be the only authority judging the safety of its own output.

For important robotics decisions, use current official FIRST rules, vendor documentation, engineering calculations, mentors, inspection guidance, and physical tests.

## Team knowledge matters

A team can become dependent on AI without realizing it. If nobody understands critical robot code because an agent wrote all of it, the team has created a maintainability and safety problem.

A useful Team 1555 standard is:

> **Someone on the team must be able to explain, test, and take responsibility for every safety-critical or competition-critical AI-assisted subsystem.**

That does not mean every student must understand every line. It means the team cannot outsource ownership.

## AI and FRC rules

Rules and legal components can change by season. Never rely on an AI model’s memory for current legality. Use the current FRC manual, official team updates, and official documentation.

FIRST’s award guidance also makes clear that teams are expected to follow Core Values, demonstrate Gracious Professionalism, and implement appropriate safety practices.

## A good AI engineering workflow

1. **Define the problem yourself.**
2. **Ask AI for options or assistance.**
3. **Inspect assumptions.**
4. **Check authoritative documentation.**
5. **Review critical code/design with another human when practical.**
6. **Test in a controlled environment.**
7. **Record what changed.**
8. **Know how to recover if it fails.**
9. **Do not hide uncertainty.**

## Key takeaway

> **AI may generate the design or code. Team 1555 still owns the robot.**

### Current sources

- FIRST resource library: https://www.firstinspires.org/resources/library
- FIRST FRC awards and safety expectations: https://www.firstinspires.org/resources/library/frc/awards
- FIRST Youth Protection and Code of Conduct: https://www.firstinspires.org/programs/youth-protection-program
