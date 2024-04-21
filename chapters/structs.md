# Structs

The `OpTypeStruct` simply reprents a C style struct.

```glsl
struct myStruct {
    int a;
    float b;
    vec3 c;
};
```

becomes

```swift
OpMemberDecorate %myStruct 0 Offset 0
OpMemberDecorate %myStruct 1 Offset 4
OpMemberDecorate %myStruct 2 Offset 16

     %int = OpTypeInt 32 1
   %float = OpTypeFloat 32
 %v3float = OpTypeVector %float 3
%myStruct = OpTypeStruct %int %float %v3float
```

## Offset ordering

It is common to not realize that the offset don't need to match with the index of the struct.

So the following

```glsl
layout(binding = 0) uniform ubo_a {
	layout(offset = 0) float x;
	layout(offset = 4) float y;
	layout(offset = 8) float z;
} A;

layout(binding = 0) uniform ubo_b {
	layout(offset = 4) float x;
	layout(offset = 8) float y;
	layout(offset = 0) float z;
} B;
```

will look like

```swift
OpMemberDecorate %ubo_a 0 Offset 0
OpMemberDecorate %ubo_a 1 Offset 4
OpMemberDecorate %ubo_a 2 Offset 8

OpMemberDecorate %ubo_b 0 Offset 4
OpMemberDecorate %ubo_b 1 Offset 8
OpMemberDecorate %ubo_b 2 Offset 0
```

When dealing with the size or padding of a struct, it is important to not assume the offset are in order of the member index.

> Note: Two index of a struct can't share the same offset values