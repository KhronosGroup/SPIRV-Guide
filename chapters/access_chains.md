# Acesss Chains

The chapter aims to give a more in detailed look of how `OpAccessChain` is used in SPIR-V with some example.

Examples:

  * [Indexing into a struct](#example---indexing-into-a-struct)
  * [In bound access](#example---in-bound-access)
  * [Accessing through physical pointers](#example---accessing-through-physical-pointers)
  * [Arrays](#example---arrays)
  * [Chained Access Chains](#example---chained-access-chains)


From reading the [spec](https://registry.khronos.org/SPIR-V/specs/unified1/SPIRV.html#OpAccessChain), simply put:

> OpAccessChains create a pointer into a composite object that can be used with OpLoad and OpStore.

The access chain takes a `Base` to a variable and then uses the `Indexes` to get the proper offset from the `Base`. This results in a pointer, which operations such as `OpLoad` and `OpStore` can then use.

> The following example uses GLSL and glslang as a more visual way to examine a valid example

## Example - Indexing into a struct

[example_struct GLSL](examples/access_chains/example_struct.comp) | [example_struct SPIR-V binary](examples/access_chains/example_struct.spv) | [example_struct SPIR-V disassembled](examples/access_chains/example_struct.spvasm)

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

```swift
OpMemberDecorate %13 0 Offset 0   // a
OpMemberDecorate %13 1 Offset 16  // b
OpMemberDecorate %13 2 Offset 32  // c
OpMemberDecorate %13 3 Offset 80  // d
OpMemberDecorate %13 4 Offset 96  // e
```

As normal, there is a `OpTypePointer` with the type of struct object and a `OpVariable` with the pointer as the result type.

```swift
%13 = OpTypeStruct %6 %7 %8 %11 %12
%14 = OpTypePointer StorageBuffer %13
%15 = OpVariable %14 StorageBuffer
```

From the single line of code `e[5] = a + b.y + c[1][2] + d[3];` there are 5 accesses into the `ssbo` struct needed (4 for loads and 1 for the store)

```swift
%21 = OpAccessChain %20 %15 %19          // Load  a
%25 = OpAccessChain %20 %15 %23 %24      // Load  b.y
%30 = OpAccessChain %20 %15 %28 %23 %29  // Load  c[1][2]
%34 = OpAccessChain %20 %15 %33 %33      // Load  d[3]
%37 = OpAccessChain %20 %15 %17 %18      // Store e[5]
```

Notice that all the accesses share both the same `Result Type` and `Base` and the only difference is the `Indexes` operands.

Since all `Indexes` must be scalar integer type and the values are known at compile time in this example, the `Indexes` can be replaced for ease of viewing the example.

```swift
%21 = OpAccessChain %20 %15 0      // Load  a
%25 = OpAccessChain %20 %15 1 1    // Load  b.y
%30 = OpAccessChain %20 %15 2 1 2  // Load  c[1][2]
%34 = OpAccessChain %20 %15 3 3    // Load  d[3]
%37 = OpAccessChain %20 %15 4 5    // Store e[5]
```

The important to notice is that access chains are not dependent on the `OpMemberDecorate Offset` value and instead use the structure's hierarchy indices.

## Example - In bound access

For structs, the `indexes` in the `OpAccessChain` must be a constant value, but for other objects (vectors, array, matrix, etc) it can be a logical pointer which means the access could be out of the bounds of the base object.

For example, the following indexing into the vector is not known until runtime:

```glsl
#version 450
layout (binding = 0) buffer ssbo {
  vec4 a;
};

shared int b;

void main() {
  float x = a[b];
}
```

```swift
%17 = OpLoad %int %b
%19 = OpAccessChain %ptr %ssbo_var %int_0 %17
```

but an application can make use of the `OpInBoundsAccessChain` to ensure that `indexes` will always be in bounds of the base object

```swift
%17 = OpLoad %int %b
// guarantees %17 will resolve within the vec4
%19 = OpInBoundsAccessChain %ptr %ssbo_var %int_0 %17
```

## Example - Accessing through physical pointers

> Note: The following SPIR-V is only valid with a proper addressing model that supports physical pointers (`Physical32`, `Physical64`, `PhysicalStorageBuffer64`, etc)

[example_physical GLSL](examples/access_chains/example_physical.comp) | [example_physical SPIR-V binary](examples/access_chains/example_physical.spv) | [example_physical SPIR-V disassembled](examples/access_chains/example_physical.spvasm)

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

```swift
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

## Example - Arrays

[example_array GLSL](examples/access_chains/example_array.comp) | [example_array SPIR-V binary](examples/access_chains/example_array.spv) | [example_array SPIR-V disassembled](examples/access_chains/example_array.spvasm)

```glsl
#version 450

struct my_struct {
  float a[4][4];
};

layout (set = 0, binding = 0) buffer SSBO {
	float x;
    my_struct y[4];
} ssbo[4];

void main() {
  float function_var[4][4][4][4][4];
  function_var[2][2][2][2][2] = ssbo[2].y[2].a[2][2];
}
```

In this example, there are 2 access chains, one to load and one to store

```swift
%29 = OpAccessChain %28 %25 %17 %26 %17 %27 %17 %17
%30 = OpLoad %6 %29
%32 = OpAccessChain %31 %15 %17 %17 %17 %17 %17
      OpStore %32 %30

// When replaced with index constants and OpName
%29 = OpAccessChain %28 %ssbo 2 1 2 0 2 2
%32 = OpAccessChain %31 %function_var 2 2 2 2 2
```

Take a look at the `function_var` first, we see that the access chain jumps through a `OpTypeArray` for each index

```swift
 %6 = OpTypeFloat 32
 %7 = OpTypeInt 32 0
 %8 = OpConstant %7 4
 %9 = OpTypeArray %6 %8
%10 = OpTypeArray %9 %8
%11 = OpTypeArray %10 %8
%12 = OpTypeArray %11 %8
%13 = OpTypeArray %12 %8
%14 = OpTypePointer Function %13
```

While the `function_var` is a trivial case, taking a look at loading `ssbo[2].y[2].a[2][2]`

```swift
%18 = OpTypeArray %6 %8
%19 = OpTypeArray %18 %8  // float a[4][4]
%20 = OpTypeStruct %19    // my_struct
%21 = OpTypeArray %20 %8  // my_struct y[4]
%22 = OpTypeStruct %6 %21 // SSBO
%23 = OpTypeArray %22 %8  // ssbo[4]

%24 = OpTypePointer StorageBuffer %23
%25 = OpVariable %24 StorageBuffer // ssbo
```

Something to be caution here is when trying to find information, such as the `OpDecorate` for the struct of the `OpVariable`, your code might have to peel a few  `OpTypeArray` or `OpTypeRuntimeArray` away first. This can be done with a simple while loop

```cpp
while (instruction.opcode() == spv::OpTypeArray || instruction.opcode() == spv::OpTypeRuntimeArray) {
    instruction = get_def(instruction.word(2)); // the Element Type operand
}
```

Also note that some API clients, such as Vulkan, have restrictions how many array-of-arrays are allowed for some storage classes.

## Example - Chained Access Chains

It is possible to have `OpAccessChain` use another `OpAccessChain` as the base

The following GLSL

```glsl
#version 450

struct Foo {
    int a;
    int b;
};

layout(set = 0, binding = 0) buffer InputBuffer {
    Foo input_values[2];
} in_v;

layout(set = 0, binding = 1) buffer OutputBuffer {
    Foo output_values[2];
} out_v;

void main() {
    in_v.output_values = out_v.input_values;
}
```

will need to do two separate `OpStore` for each element of the `Foo[2]` array

This can be done with a 2-deep index access chain

```swift
// output_values[0].a
%ac_0 = OpAccessChain %ptr_struct %out_val %int_0 %int_0
OpStore %ac_0 %val_0

// output_values[0].b
%ac_1 = OpAccessChain %ptr_struct %out_val %int_0 %int_1
OpStore %ac_1 %val_1
```

but it can also use an intermediate `OpAccessChain` as well

```swift
// output_values[0]
%ac_base = OpAccessChain %ptr_array %out_val %int_0

// a
%ac_0 = OpAccessChain %ptr_struct %ac_base %int_0
OpStore %ac_0 %val_0

// b
%ac_1 = OpAccessChain %ptr_struct %ac_base %int_1
OpStore %ac_1 %val_1
```
