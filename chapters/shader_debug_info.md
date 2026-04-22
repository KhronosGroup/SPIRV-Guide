# NonSemantic Shader DebugInfo

This is the extended instruction set to provide debug information in your SPIR-V, it can even allow users to [step through source code](https://vulkan.org/user/pages/09.events/vulkanised-2023/vulkanised_2023_source_level_shader_debugging_in_vulkan_with_renderdoc.pdf).

While there is `OpLine` and `OpSource` already in SPIR-V, it has been showen to fall short what is needed to give proper debugging information about the source.

The [OpenCL.DebugInfo.100](https://registry.khronos.org/SPIR-V/specs/unified1/OpenCL.DebugInfo.100.html) was added around when SPIR-V 1.0 was released. Vulkan wanted a similar debug info for `Shader` SPIR-V and created the [NonSemantic.Shader.DebugInfo.100](https://github.khronos.org/SPIRV-Registry/nonsemantic/NonSemantic.Shader.DebugInfo.html) extended instructions.

Later a 101 revision was added (`NonSemantic.Shader.DebugInfo.101`) and so there is now there is a unified header ([NonSemanticShaderDebugInfo.h](https://github.com/KhronosGroup/SPIRV-Headers/blob/main/include/spirv/unified1/NonSemanticShaderDebugInfo.h)) and the legacy 100 version header ([NonSemanticShaderDebugInfo100.h](https://github.com/KhronosGroup/SPIRV-Headers/blob/main/include/spirv/unified1/NonSemanticShaderDebugInfo100.h))

As you may have noticed, the `Shader` version is built around the [NonSemantic](https://github.com/KhronosGroup/SPIRV-Guide/blob/main/chapters/nonsemantic.md) extension to make sure anyone who supports [SPV_KHR_non_semantic_info](http://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/main/extensions/KHR/SPV_KHR_non_semantic_info.html) extension already can now support `Shader DebugInfo`.

## How to use

The spec is found on the registry - https://github.com/KhronosGroup/SPIRV-Registry/blob/main/nonsemantic/NonSemantic.Shader.DebugInfo.asciidoc

The headers are found here - https://github.com/KhronosGroup/SPIRV-Headers/blob/main/include/spirv/unified1/NonSemanticShaderDebugInfo.h

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

For those who want to consume ShaderDebugInfo, here is some information to be aware of.

### Getting the import ID

You will want to track the `OpExtInstImport`, so first thing will be doing a string compare on

```
%debug_info = OpExtInstImport "NonSemantic.Shader.DebugInfo.100"
```

to track the `%debug_info` where it is used later.

Also be aware that there might other version such as `"NonSemantic.Shader.DebugInfo.101"`

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

Example when `DebugSourceContinued` is used

```swift
  %source_text_0 = OpString "
        lots of source
        ....
        hit string max"
  %source_text_1 = OpString "
        rest of the source"

%debug_source   = OpExtInst %void %import DebugSource %file_name %source_text_0
%debug_source_c = OpExtInst %void %import DebugSourceContinued %source_text_1
```

Be care when parsing `DebugSourceContinued` as a new instruciton is **not** a new line.

```swift
%code0 = OpString "line 1 here
"
%code1 = OpString "line 2 here"
%code2 = OpString " still on line 2"
%code3 = OpString " still on line 2 and its long
line 3
"
%code4 = OpString "line 4"

%dbg_src0 = OpExtInst %void %debug_info DebugSource %file %code0
%dbg_src1 = OpExtInst %void %debug_info DebugSourceContinued %code1
%dbg_src2 = OpExtInst %void %debug_info DebugSourceContinued %code2
%dbg_src3 = OpExtInst %void %debug_info DebugSourceContinued %code3
%dbg_src4 = OpExtInst %void %debug_info DebugSourceContinued %code4
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
