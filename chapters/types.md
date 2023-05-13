# Types

SPIR-V has a type system in order to define any type of variable.
All types start with the `OpType` prefix.
Types can be stacked on each other to build more complex types

## Example - Mat3x2

In order to define a 3x2 matrix of 32-bit floats, the following SPIR-V can be used.

```swift
%float       = OpTypeFloat 32
%v2float     = OpTypeVector %float 2
%mat3v2float = OpTypeMatrix %v2float 3
```

## Example - Structs

To define the following struct

```glsl
struct myStruct {
    int   a;
    float b;
    int   c;
}
```

the base types are defined and then ordered in the struct type.

```swift
%int = OpTypeInt 32 1
%float = OpTypeFloat 32
%myStruct = OpTypeStruct %int %float %int
```