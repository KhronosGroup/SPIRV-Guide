# Acesss Chains

The chapter aims to give a more in detailed look of how `OpAccessChain` is used in SPIR-V with some example.

From reading the [spec](https://www.khronos.org/registry/spir-v/specs/unified1/SPIRV.html#OpAccessChain), simply put:

> OpAccessChains create a pointer into a composite object that can be used with OpLoad and OpStore.

The access chain takes a `Base` to a variable and then uses the `Indexes` to get the proper offset from the `Base`. This results in a pointer, which operations such as `OpLoad` and `OpStore` can then use.

> The following example uses GLSL and glslang as a more visual way to examine a valid example

## Example 0 - Indexing into a struct

[example_0 GLSL](examples/access_chains/example_0.comp) | [example_0 SPIR-V binary](examples/access_chains/example_0.spv) | [example_0 SPIR-V disassembled](examples/access_chains/example_0.spvasm)

```glsl
#version 450

layout(set = 0, binding = 0) buffer ssbo {
    float a;
    vec3 b;
    mat3 c;
    float d[4];
    float e[];
};

void main()
{
    e[5] = a + b.y + c[1][2] + d[3];
}
```

In this example, for simplicity, both "relaxed block layout" and "scalar block layout" are not used. This results with the following offsets for `ssbo`.

```
OpMemberDecorate %13 0 Offset 0   // a
OpMemberDecorate %13 1 Offset 16  // b
OpMemberDecorate %13 2 Offset 32  // c
OpMemberDecorate %13 3 Offset 80  // d
OpMemberDecorate %13 4 Offset 96  // e
```

As normal, there is a `OpTypePointer` with the type of struct object and a `OpVariable` with the pointer as the result type.

```
%13 = OpTypeStruct %6 %7 %8 %11 %12
%14 = OpTypePointer StorageBuffer %13
%15 = OpVariable %14 StorageBuffer
```

From the single line of code `e[5] = a + b.y + c[1][2] + d[3];` there are 5 accesses into the `ssbo` struct needed (4 for loads and 1 for the store)

```
%21 = OpAccessChain %20 %15 %19          // Load  a
%25 = OpAccessChain %20 %15 %23 %24      // Load  b.y
%30 = OpAccessChain %20 %15 %28 %23 %29  // Load  c[1][2]
%34 = OpAccessChain %20 %15 %33 %33      // Load  d[3]
%37 = OpAccessChain %20 %15 %17 %18      // Store e[5]
```

Notice that all the accesses share both the same `Result Type` and `Base` and the only difference is the `Indexes` operands.

Since all `Indexes` must be scalar integer type and the values are known at compile time in this example, the `Indexes` can be replaced for ease of viewing the example.

```
%21 = OpAccessChain %20 %15 0      // Load  a
%25 = OpAccessChain %20 %15 1 1    // Load  b.y
%30 = OpAccessChain %20 %15 2 1 2  // Load  c[1][2]
%34 = OpAccessChain %20 %15 3 3    // Load  d[3]
%37 = OpAccessChain %20 %15 4 5    // Store e[5]
```

The important to notice is that access chains are not dependent on the `OpMemberDecorate Offset` value and instead use the structure's hierarchy indices.

## Example 1 - Accessing through physical pointers

> Note: The following SPIR-V is only valid with a proper addressing model that supports physical pointers (`Physical32`, `Physical64`, `PhysicalStorageBuffer64`, etc)

[example_1 GLSL](examples/access_chains/example_1.comp) | [example_1 SPIR-V binary](examples/access_chains/example_1.spv) | [example_1 SPIR-V disassembled](examples/access_chains/example_1.spvasm)

```glsl
#version 450
#extension GL_EXT_buffer_reference : require

// forward declaration
layout(buffer_reference) buffer blockType;

layout(buffer_reference) buffer blockType {
    int x;
    blockType next;
};

layout(set = 0, binding = 0) buffer rootBlock {
    int result;
    blockType root;
};

void main() {
    // Example of stepping through a linked list
    result = root.next.next.next.x;
}
```

The main goal of this example is to show how `OpAccessChain` can also access loads from other `OpAccessChain` as well.

The code `root.next.next.next.x` produces 5 `OpLoad` and `OpAccessChain` to get the value stored to `result`.

```
%15    = OpAccessChain %14 %11 %13     // root
%root  = OpLoad %7 %15                 // loads root

%18    = OpAccessChain %17 %root %13   // next
%next0 = OpLoad %7 %18                 // loads root.next

%20    = OpAccessChain %17 %next0 %13  // next
%next1 = OpLoad %7 %20                 // loads root.next.next

%22    = OpAccessChain %17 %next1 %13  // next
%next2 = OpLoad %7 %22                 // loads root.next.next.next

%25    = OpAccessChain %24 %next2 %12  // x
%x     = OpLoad %6 %25                 // loads root.next.next.next.x
```