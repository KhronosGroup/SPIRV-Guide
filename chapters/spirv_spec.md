# SPIR-V Specification

The SPIR-V Specification (referred usually as the SPIR-V Spec) is the official description of how the SPIR-V intermediate representation is laid out. This defines what is and is not valid SPIR-V.

[Most information regarding the spec can be found on in the SPIR-V registry](https://www.khronos.org/registry/spir-v/)

## Unified Spec

Starting in SPIR-V 1.3 the SPIR-V Working Group decided to start adopting a "unified spec" instead of creating another separate version. The goal was to be able to reference a single spec instead of having to bounce around versions. Where there is a 1.0, 1.1, and 1.2 version of the spec, it is **highly** encouraged to ignore those and proceed to use the unified spec.

## SPIR-V Spec Formats

The spec is generated for
- [html](https://www.khronos.org/registry/spir-v/specs/unified1/SPIRV.html)
- [html formatted for mobile devices](https://www.khronos.org/registry/spir-v/specs/unified1/SPIRV.mobile.html)
- [pdf](https://www.khronos.org/registry/spir-v/specs/unified1/SPIRV.pdf)

## Using the spec

The spec is currently broken down into 4 sections

1. [Introduction](https://www.khronos.org/registry/spir-v/specs/unified1/SPIRV.html#_introduction)
    - Gives a helpful overview of SPIR-V. It is not very long and worth reading as the SPIR-V Guide is aimed not to repeat the information.
2. [Specification](https://www.khronos.org/registry/spir-v/specs/unified1/SPIRV.html#_a_id_specification_a_specification)
    - Breaks down all the terms used in SPIR-V. It also goes over what is and is not valid.
3. [Binary Form](https://www.khronos.org/registry/spir-v/specs/unified1/SPIRV.html#_a_id_binary_a_binary_form)
    - List all instructions, starting with the numerical values for all fields. This is the information found in the [SPIRV-Headers](https://github.com/KhronosGroup/SPIRV-Headers)
    - [Instructions](https://www.khronos.org/registry/spir-v/specs/unified1/SPIRV.html#_a_id_instructions_a_instructions)
        - Lists the information for each instruction found in SPIR-V
4. [Appendix](https://www.khronos.org/registry/spir-v/specs/unified1/SPIRV.html#_appendix_a_changes)
    - Goes over changes made to unified spec over time

## SPIR-V Grammar File

The part of the SPIR-V spec and header is generated from the [spirv.core.grammar.json](https://github.com/KhronosGroup/SPIRV-Headers/blob/main/include/spirv/unified1/spirv.core.grammar.json) file.

This contains information about every instruction and operand in SPIR-V