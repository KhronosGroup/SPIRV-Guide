# NonSemantic Shader DebugInfo

This is the extended instruction set to provide debug information in your SPIR-V, it can even allow users to [step through source code](https://vulkan.org/user/pages/09.events/vulkanised-2023/vulkanised_2023_source_level_shader_debugging_in_vulkan_with_renderdoc.pdf).

While there is `OpLine` and `OpSource` already in SPIR-V, it has been showen to fall short what is needed to give proper debugging information about the source.

The [OpenCL.DebugInfo.100](https://registry.khronos.org/SPIR-V/specs/unified1/OpenCL.DebugInfo.100.html) was added around when SPIR-V 1.0 was released. Vulkan wanted a similar debug info for `Shader` SPIR-V and created the [NonSemantic.Shader.DebugInfo.100](https://github.com/KhronosGroup/SPIRV-Registry/blob/main/nonsemantic/NonSemantic.Shader.DebugInfo.100.asciidoc) extended instructions.

As you may have noticed, the `Shader` version is built around the [NonSemantic](https://github.com/KhronosGroup/SPIRV-Guide/blob/main/chapters/nonsemantic.md) extension to make sure anyone who supports [SPV_KHR_non_semantic_info](http://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/KHR/SPV_KHR_non_semantic_info.html) extension already can now support `Shader DebugInfo`.

## How to use

The spec is found on the registry - https://github.com/KhronosGroup/SPIRV-Registry/blob/main/nonsemantic/NonSemantic.Shader.DebugInfo.100.asciidoc

The headers are found here - https://github.com/KhronosGroup/SPIRV-Headers/blob/main/include/spirv/unified1/NonSemanticShaderDebugInfo100.h

The most basic "hello world" example would be something like

```swift
// https://godbolt.org/z/7K3xbT5Wc
               OpCapability Shader
               OpExtension "SPV_KHR_non_semantic_info"
 %debug_info = OpExtInstImport "NonSemantic.Shader.DebugInfo.100"
               OpMemoryModel Logical GLSL450
               OpEntryPoint GLCompute %main "main"
               OpExecutionMode %main LocalSize 1 1 1
       %file = OpString "my_code.comp"
       %void = OpTypeVoid
          %x = OpExtInst %void %debug_info DebugSource %file
  %func_void = OpTypeFunction %void
       %main = OpFunction %void None %func_void
      %label = OpLabel
               OpReturn
               OpFunctionEnd
```

You first import `%debug_info = OpExtInstImport "NonSemantic.Shader.DebugInfo.100"` and from there call `OpExtInst` on the various callers

## Generating

Currently the following tools already generate Shader DebugInfo

```bash
./glslang -gV  # generate nonsemantic shader debug information
./glslang -gVS # generate nonsemantic shader debug information with source

./dxc -fspv-extension=SPV_KHR_non_semantic_info -fspv-debug=vulkan-with-source

./slangc -g2
./slangc -gstandard # same as -g2
```

## Consuming

There are many instructions added, here is a breadown of some of the more common ones.

### Getting the source

The `DebugSource` and `DebugSourceContinued` are used to reference the file and source text.

```swift
    %file_name = OpString "my_source.comp"
  %source_text = OpString "#
        void main() {
            // some code
        }"

%debug_source = OpExtInst %void %import DebugSource %file_name %source_text
```

### Getting the line and column

Once you have a source the `DebugLine` and `DebugNoLine` can be used to

```
%uint = OpTypeInt 32 0
%uint_2 = OpConstant %uint 2
%uint_4 = OpConstant %uint 4
%uint_6 = OpConstant %uint 6

%x = OpExtInst %void %import DebugLine %debug_source %uint_2 %uint_2 %uint_4 %uint_6
```

Here we see the line of the following code occurs at `line 2, column 4:6`
