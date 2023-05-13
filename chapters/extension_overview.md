# Extension Overview

Extensions are a way to add features to the SPIR-V spec as described in the [extendability section of the spec](https://www.khronos.org/registry/spir-v/specs/unified1/SPIRV.html#_extendability). All extension can be found in the [SPIRV-Registry](https://github.com/KhronosGroup/SPIRV-Registry/tree/master/extensions)

Some extensions are "vendor" extension and are labeled as `SPV_VENDOR_Extension_name`. These types of extensions allow a vendor to expose features in SPIR-V shaders which are not going to be available on other vendor's implementations.

The rest of the extensions are "multi-vendor" and are labeled as either `SPV_EXT_Extension_name` or `SPV_KHR_Extension_name`. These extensions are sometimes brought into core in new versions. An example is `SPV_KHR_8bit_storage` which was an extension prior to being added to core in SPIR-V 1.5. The means anyone supporting SPIR-V 1.5 is expected to support all the additions from `SPV_KHR_8bit_storage` as they are now "core" or "standard" features.

> The main difference between `EXT` and `KHR` is that KHR is a Khronos extensions and are ratified by Khronos, therefore are covered by the Khronos IP framework.

> **Tip**: Prepend the URL in the SPIRV-Registry with `http://htmlpreview.github.io/?` to preview the page as html. Example with [SPV_KHR_8bit_storage](http://htmlpreview.github.io/?https://github.com/KhronosGroup/SPIRV-Registry/blob/master/extensions/KHR/SPV_KHR_8bit_storage.html)


## Extension Workflow

Extensions are mainly added to correspond to a client API's usage ([Vulkan workflow example](https://github.com/KhronosGroup/Vulkan-Guide/blob/master/chapters/spirv_extensions.adoc)).

Using `SPV_KHR_multiview` as an example with the following GLSL targeting SPIR-V 1.0

```glsl
#version 450
#extension GL_EXT_multiview : enable

void main() {
    float pos = 1.0;
    if (gl_ViewIndex == 0) {
        pos = 2.0;
    }
    gl_Position = vec4(pos, 1.0, 1.0, 1.0);
}
```

produce the following SPIR-V disassembly with `glslangValidator -V example.vert`

```swift
; Version: 1.0

    OpCapability MultiView
    OpExtension "SPV_KHR_multiview"

    OpName %gl_ViewIndex "gl_ViewIndex"

    OpDecorate %gl_ViewIndex BuiltIn ViewIndex
    OpMemberDecorate %gl_PerVertex 0 BuiltIn Position
    OpMemberDecorate %gl_PerVertex 1 BuiltIn PointSize
    OpMemberDecorate %gl_PerVertex 2 BuiltIn ClipDistance
    OpMemberDecorate %gl_PerVertex 3 BuiltIn CullDistance
    OpDecorate %gl_PerVertex Block

         %int = OpTypeInt 32 1
         %ptr = OpTypePointer Input %int
%gl_ViewIndex = OpVariable %ptr Input
       %int_0 = OpConstant %int 0
        %bool = OpTypeBool

          %13 = OpLoad %int %gl_ViewIndex
          %16 = OpIEqual %bool %13 %int_0
```

There are two main things to take away from this.

1. The `ViewIndex` builtin which from the spec shows

![extension_overview_view_index.png](../images/extension_overview_view_index.png)

that the `MultiView` capability is needed in order to us this prior to SPIR-V 1.3

![extension_overview_multi_view.png](../images/extension_overview_multi_view.png)

2. If the above shader would have been compiled as `glslangValidator -V example.vert --target-env spirv1.3` the only difference would be the extension line would be gone and the module version

```patch
$ spirv-diff example1.spv example2.spv

 ; SPIR-V
-; Version: 1.0
+; Version: 1.3
 ; Generator: Khronos Glslang Reference Front End; 11
 ; Bound: 31
 ; Schema: 0
                OpCapability Shader
                OpCapability MultiView
-               OpExtension "SPV_KHR_multiview"
```

To sum it all up, a "feature" such as `ViewIndex` is hidden behind a capability bit (`MultiView` in this case) and the capability is either exposed due to an extension or a version of SPIR-V
