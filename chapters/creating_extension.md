# Creating a SPIR-V Extension

Some extensions are created internally inside the SPIR-V Working Group, but SPIR-V being an open standard allows for public suggestions/requests of extensions. The following list the process to add an extension, assuming the Working Group has agreed to want to accept it.

- Create a PR to [SPIRV-Registry](https://github.com/KhronosGroup/SPIRV-Registry)
    - Make sure to append the `README.md` in your PR

## Designing the extension

> The following will go over what to consider for each section of the extension text

> A [template is provided](./extension_template.asciidoc) to help follow along or else just use an already published extension

### Metadata group

The Metadata group of sections provides information about the extension itself

- **Name Strings**: The name of the extension.
- **Contact**: A URL where an interested reader can contact the extension authors to
report issues.
- **Contributors**: Names the people who materially contributed to the definition of
the extension.
- **Status**: Indicates the stage of review. Valid states are [`Proposed`, `Complete`, `Ratified`]. If a Complete KHR extension has been approved by the
SPIR Working Group, then note that along with the date. When a Complete
extension has been ratified by the Khronos Board, then note that along with
the ratification date.
- **Version**: Date and revision number.
- **Dependencies**: Indicates what specification is being extended, including
version and revision information.  This is called the base specification.
If applicable, also names related specifications and extensions

### Overview Group

The **Overview** should consist of one or more sections that introduce the collection of features at a high level.

Ideally, the overview motivates the features, describes how they fit together to fulfill the need, and how they fit together with the design of the rest of SPIR-V.

### Specification deltas group

The specification deltas group consists of one or more sections describing the textual changes to the specification. Deltas should be listed in the same order as the sections they modify (or add to) the main specification.

Note that changes or additions to the list of enumerated tokens or instruction syntax imply changes to the SPIR-V grammars encoded as JSON files. Work with the specification editors to ensure the changes to the JSON files are clearly understood.

### Token registration

All new token values must be drawn from ranges registered in the [SPIR-V XML Registry file](https://github.com/KhronosGroup/SPIRV-Headers/blob/master/include/spirv/spir-v.xml) before an extension can be considered complete.

### Issues group

The **Issues** section should summarize significant known issues. If a listed issue is resolved during the review, the resolution should be summarized here. Note that detailed and ongoing review and discussion should occur via the tracking issue (bug).

### Revision history section

The **Revision History** section should summarize the evolution of the extension over time. This is especially important whenever the extension is revised after initial publication

### Token naming

Different semantics require different names. When a named enumerated token might change semantics during the evolution of the extension from vendor to EXT and finally to KHR, then the token name should use a corresponding suffix. For example, an `OpWidget` concept in an EXT extension should be named `OpWidgetEXT`, and it should be named `OpWidgetKHR` when included in a KHR extension.

Naming summary:
- Default is to add a suffix on each new token.
- Normally all new tokens use the same suffix.
- If not expected to be ratified by Khronos, use an EXT or vendor suffix.
- If on track to be ratified by Khronos, use a KHR suffix.
- If on track to be ratified by Khronos, _and_ you fully expect the feature to eventually migrate to core with the same semantics, then no suffix is required.  This is a high bar, requiring Working Group agreement that the final semantics are already achieved.
- Aliasing:  If an extension is pulled into core without changing semantics, then the new core spec can add an alias: a new name without the suffix but denoting the same numeric value. In this case the JSON grammar will have a new numerant object with the different name spelling but same integer value.
- Follow existing conventions.  For example, if introducing a new group instruction, its name should start with **OpGroup**.

### OpExtension and OpCapability

An extension specification requires the addition of an `OpExtension` instruction with the name of the extension.

If features in the extension might be still optional when pulled into core, then the extension specification must include new `OpCapability` tokens to guard those features.

Note a single extension could be defining 0, 1, or multiple new capabilities; in general, there is no 1:1 mapping of extensions to capabilities.

Since we don't know the future, the norm is to guard new functionality with new capabilities, unless we know the feature will be required when in core. The latter is more likely when the change does not pertain to the functionality of target platforms.

## Updating the JSON grammar files

### Why should I update the grammar file?

The syntax of SPIR-V instructions, including enum values, is described by a machine-readable grammar file in JSON form.

Most extensions will:

- Add a Capability enum
- Likely add BuiltIn, Decoration, or other enums
- Possibly add new instructions

Therefore, normally a new extension would be accompanied by an update to the grammar file to describe the new tokens and instructions.

The core instruction grammar file is:

- The source of truth for generating tables in the SPIR-V specification,
- The source of truth for the language-specific header files,
    - [spirv/unified1/spirv.h](https://github.com/KhronosGroup/SPIRV-Headers/blob/master/include/spirv/unified1/spirv.h), and
- Published as [spirv.core.grammar.json](https://github.com/KhronosGroup/SPIRV-Headers/blob/master/include/spirv/unified1/spirv.core.grammar.json) in the SPIRV-Headers repo
- The source of truth for the SPIRV-Tools assembler, binary parser, and disassembler. (The SPIRV-Tools find the grammar files in the SPIRV-Headers tree you've pulled into your workspace.)
- Optional: Rebuild the headers by running the script ([as described in the README](https://github.com/KhronosGroup/SPIRV-Headers#generating-c-headers-for-extended-instruction-sets)) to generate the C header file.
    - Verify that the headers have the new tokens.
    - Verify that generated spec tables have the new tokens.
    - Verify that new instructions have the correct parameter lists.

### What should I change in the grammar file?

The syntax and semantics of the JSON file itself are described in [SPIR-V Machine-readable Grammar](https://www.khronos.org/registry/spir-v/specs/1.0/MachineReadableGrammar.html).

The main part of the file is a list of lists of enums. Each enum entry is a dictionary listing the name, numeric value, and optionally the list of capabilities that enable that enumerant.

For example, there is a list of `BuiltIn` enums, and its `PointSize` entry is:
```
  {
    "enumerant" : "PointSize",
    "value" : "1",
    "capabilities" : [ "Shader" ]
  },
```

Entries should be ordered by their enumerant value to make it easier to merge multiple versions together (from Khronos, public, and multiple PRs).


An enum entry can also have attributes to describe when the feature is available:

- The `version` attribute corresponds to the
  "[missing before](https://www.khronos.org/registry/spir-v/specs/unified1/SPIRV.html#Unified)"
  annotation in the SPIR-V specification.
  The `version` attribute indicates the first SPIR-V version in which the feature exists
  as part of the core specification, without the need to use an `OpExtension` instruction.
  A feature introduced by an extension should always set the `version` attribute to `"None"`.
- The `extension` attribute, if present, indicates the name of an extension to use
  with the `OpExtension` instruction when the feature is not yet part of the core SPIR-V specification.
  The `extension` attribute is a list of strings, in case a feature can be exposed through multiple
  extensions.
- If an enum token is only usable when the SPIR-V module declares a capability, then that capability
  must be listed in the `capabilities` attribute for that enum.
  The `capabilities` attribute is a list of strings, in case several capabilities can enable a feature.

See [2.22 Unified Specification](https://www.khronos.org/registry/spir-v/specs/unified1/SPIRV.html#Unified)
in the SPIR-V specification for more information.

A common pattern is to use the `version` and `extension` attributes on the capabilities introduced by the extension.
Other tokens introduced by the extension can declare their dependence on one or more of those new capabilities.

For example, this is the entry for the `ShaderViewportIndexLayerEXT` capability:

```
  {
    "enumerant" : "ShaderViewportIndexLayerEXT",
    "value" : 5254,
    "capabilities" : [ "MultiViewport" ],
    "extensions" : [ "SPV_EXT_shader_viewport_index_layer" ],
    "version" : "None"
  },
```

This is one of the tokens enabled by the extension, the `ViewportIndex` `BuiltIn`:

```
  {
    "enumerant" : "ViewportIndex",
    "value" : 10,
    "capabilities" : [ "MultiViewport", "ShaderViewportIndex", "ShaderViewportIndexLayerEXT" ]
  },
```

Note that the `ViewportIndex` token can be enabled by `ShaderViewportIndexLayerEXT`, and in turn
that capability is enabled by the extension.


### Special considerations when adding an instruction

Adding a new instruction is more involved because you need to provide a grammar rule for the operands, and each operand must be assigned the right
operand kind. The rule can be subtle if there are optional, optionally repeating, or optionally repeating pairs of operands. For example, the `OpSwitch` rule is tricky.

In particular, always use `IdResult` for a `Result <id>`, and `IdResultType` for a `Type <id>`. The `<id>` operands are just `Id`.
