# LocalSize and WorkgroupSize

When dealing with things such as `GLCompute` or `Kernel`, you will come across the following: `LocalSize`, `LocalSizeId`, and `WorkgroupSize`

These shaders execute in `global workgroups` which are divided into a number of local workgroups with a size that can be set with one of the above.
An invocation within a local workgroup can share data with other members of the local workgroup through shared variables and issue memory and control flow barriers to synchronize with other members of the local workgroup.

## LocalSize

`LocalSize` is an [Execution Mode](../chapters/entry_execution.md#execution-mode), it can be statically set in most shading languages.

```glsl
// GLSL Example
#version 450
layout (local_size_x = 2, local_size_y = 4, local_size_z = 1) in;
void main() { }

// SPIR-V
OpExecutionMode %main LocalSize 2 4 1
```

## LocalSizeId

`LocalSizeId` is also an Execution Mode, but it allows the size to be set dynamically via things such as specialization constant.

```glsl
// GLSL Example
#version 450
layout(local_size_x_id = 3, local_size_y_id = 4) in;
void main() { }

// SPIR-V
OpExecutionModeId %main LocalSizeId %7 %8 %uint_1
OpDecorate %7 SpecId 3
OpDecorate %8 SpecId 4
%7 = OpSpecConstant %uint 1
%8 = OpSpecConstant %uint 1
%uint_1 = OpConstant %uint 1
```

## WorkgroupSize

Unlike the others, `WorkgroupSize` is a built-in decoration.

> Important: If an object is decorated with the `WorkgroupSize` decoration, this takes **precedence over** any `LocalSize` or `LocalSizeId` execution mode.

```swift
OpDecorate %gl_WorkGroupSize BuiltIn WorkgroupSize
%gl_WorkGroupSize = OpConstantComposite %v3uint %uint_2 %uint_4 %uint_1
```

The `WorkgroupSize` was deprecated starting with version 1.6 in favor of using `LocalSizeId`. The main issue is Vulkan doesn't support `LocalSizeId` unless you have `VK_KHR_maintenance4` or Vulkan 1.3+

