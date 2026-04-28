# Explicit Layout

Sometimes in programming languages, the compiler determines how variables are packed into memory.
It might insert padding to satisfy alignment requirements, meaning you don't always know exactly how many bytes a specific variable has.

[Explicit Layout](https://registry.khronos.org/SPIR-V/specs/unified1/SPIRV.html#ExplicitLayout) is the practice of expressing in the SPIR-V exactly where every byte of a data structure resides in memory.

> Note: Explicit layout requirement is based on the client API. Vulkan uses it, but OpenCL does not.

If a type has an **explicit layout**, it means its size, padding, and member locations are defined by SPIR-V decorations, leaving zero ambiguity for the compiler back-end.

## Applying Decorations

Depending on the type, there is a different `OpDecorate` (or `OpMemberDecorate`) to apply the explicit layout.

- `OpTypeStruct` use `Offset` on each member
- `OpTypeArray` use `ArrayStride`
- etc (all ways can be found in [the spec](https://registry.khronos.org/SPIR-V/specs/unified1/SPIRV.html#ExplicitLayout))

## Use by storage class

If you are passing data between the host (CPU) and the device (GPU), SPIR-V requires an explicit layout.

This means storage classes such as `Uniform`, `StorageBuffer`, `PushConstant` are **required** to have an explicit layout.

For memory that is purely local to the shader execution, the implementation wants the freedom to pack and optimize data into registers or specialized memory banks as it sees fit.

This means storage classes such as `Function`, `Private`, `Workgroup` are **not allowed** to have an explicit layout.

> With [SPV_KHR_workgroup_memory_explicit_layout](https://github.khronos.org/SPIRV-Registry/extensions/KHR/SPV_KHR_workgroup_memory_explicit_layout.html) it is possible to use with `Workgroup`
>
> [SPV_EXT_descriptor_heap](https://github.khronos.org/SPIRV-Registry/extensions/EXT/SPV_EXT_descriptor_heap.html) also changes this (partially) for `UniformConstant` (used as heaps).

## Why the Type ID Matters

Imagine the following structurally identical types:

```swift
    %uint = OpTypeInt 32 0
%struct_a = OpTypeStruct %uint %uint
%struct_b = OpTypeStruct %uint %uint
```

If you try to load from `%struct_a` but have a result type of `%struct_b` such as

```swift
%ptr = OpTypePointer PhysicalStorageBuffer %struct_a
%ac = OpAccessChain %ptr %base %int_0
%load = OpLoad %struct_b %ac
```

you will get an error in `spirv-val`.

The issue is the structs **might** have a different explicit layout.

```swift
OpMemberDecorate %struct_a 0 Offset 0
OpMemberDecorate %struct_a 1 Offset 4

OpMemberDecorate %struct_b 0 Offset 0
OpMemberDecorate %struct_b 1 Offset 8
```

To prevent the compiler to have to do deep comparisons, it is the responsibility for those generating SPIR-V to make sure the same `OpTypeStruct` ID is used in this case.

## Using OpCopyLogical

[OpCopyLogical](https://registry.khronos.org/SPIR-V/specs/unified1/SPIRV.html#OpCopyLogical) is a variant of `OpCopyObject` specifically designed to handle copying aggregates (array or structure) that differ only in their layout decorations.

For example if some code is trying to copy a [`Uniform`, explicit layout, `OpTypeStruct`] over to a [`Function`, no explicit layout, `OpTypeStruct`], it previously had to load/store each component of the struct one at a time. Starting in SPIR-V 1.4, `OpCopyLogical` can be used.

Example of this can be easily seen in a [simple GLSL example](https://godbolt.org/z/7h6xfxdd7)

```patch
    %1 = OpAccessChain %ptr_Uniform_struct_a %var %int_0
    %2 = OpLoad %struct_a %1
-    %3 = OpCompositeExtract %uint %2 0
-    %4 = OpAccessChain %ptr_Function_uint %new_var %int_0
-         OpStore %4 %3
-    %5 = OpCompositeExtract %uint %2 1
-    %6 = OpAccessChain %ptr_Function_uint %new_var %int_1
-         OpStore %6 %5
+    %3 = OpCopyLogical %struct_b %2
+         OpStore %new_var %3
```

The only requirement for `OpCopyLogical` is that it must "logically match" (the underlying type, without the decorations, must be the same).

## Matrix

Matrices are a bit different as the type does **not** define the memory layout.

Using a [simple GLSL example](https://godbolt.org/z/dEdjca4s5) you can see calling

```glsl
vec4 Foo(mat4 inMat) {
    return inMat * vec4(1, 2, 3, 4);
}
```

the matrix is defined as mathematical concept

```
      %float = OpTypeFloat 32
    %v4float = OpTypeVector %float 4
%mat4v4float = OpTypeMatrix %v4float 4
```

This is by design as it means you don't have to change types when passing a matrix as a parameter. The compiler also doesn't have to decide to put it in registers or making a local variable (since local variables don't have an explicit layout).

The `MatrixStride` and `ColMajor`/`RowMajor` is an attribute of the variable or struct member that has matrix type.
