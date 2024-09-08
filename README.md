# SPIR-V Guide

![SPIR-V logo](./images/spirv_logo.png)
![Khronos logo](./images/khronos_logo.png)

The SPIR-V Guide is designed to help developers get up and going with the world of SPIR-V. This guide is targeted at developers needing to use compilers SPIR-V in their tool chains and for developers wishing to develop custom tooling or compilers that outputs SPIR-V.

## Default Branch Renamed to 'main'

As of January 23, 2024, the default branch of this repository has been renamed from 'master' to 'main' following Khronos policy.
Instructions for updating local repository clones are provided by GitHub.

## Logistics Overview
- [What is SPIR-V?](./chapters/what_is_spirv.md)
- [What can you do with SPIR-V](./chapters/what_spirv_can_do.md)
- [SPIR-V Spec](./chapters/spirv_spec.md)
- [Internals of SPIR-V](./chapters/spirv_internals.md)
- [Capabilities system](./chapters/capabilities.md)

## Tooling
- [Khronos provided tooling](./chapters/khronos_tooling.md)
- [Parsing instructions](./chapters/parsing_instructions.md)

## Understanding SPIR-V
- [Entry Point, Execution Model, and Execution Mode](./chapters/entry_execution.md)
- [Types](./chapters/types.md)
- [Structs](./chapters/structs.md)
- [Access Chains](./chapters/access_chains.md)
- [Storage Class](./chapters/storage_class.md)
- [Image Accesses](./chapters/image_accesses.md)

## Control Flow
- [Functions and Blocks](./chapters/functions_blocks.md)
- [CFG Unordered Nesting](./chapters/cfg_unordered_nesting.md)

### Outside educational material
- [google/spirv-tutor](https://github.com/google/spirv-tutor)
- Khronos Developer Day Osaka 2023 ([video](https://youtu.be/sgUPm0fGSbs?si=Qu09UolraAIzkVS7&t=13229) and [slides](https://www.lunarg.com/wp-content/uploads/2023/05/SPIRV-Osaka-MAY2023.pdf))

## Extending SPIR-V
- [Extensions overview](./chapters/extension_overview.md)
    - [Extensions by version](./chapters/extension_by_version.md)
- [Creating an extension](./chapters/creating_extension.md)
- [Extended instruction sets](./chapters/extended_instruction_sets.md)
- [Non-Semantic Instructions](./chapters/nonsemantic.md)
