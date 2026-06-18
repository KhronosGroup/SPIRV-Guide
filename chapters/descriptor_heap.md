# Descriptor Heap

The [SPV_EXT_descriptor_heap](https://github.khronos.org/SPIRV-Registry/extensions/EXT/SPV_EXT_descriptor_heap.html) extension was added for [VK_EXT_descriptor_heap](https://docs.vulkan.org/guide/latest/descriptor_heap.html) and provides a new paradigm for binding descriptors.

This chapter will **not** go into the details of [SPV_KHR_untyped_pointers](./untyped_pointers.md), as that is a dependency and a feature that can be used regardless of descriptor heaps.

This chapter also assumes you already have a good grasp of [VK_EXT_descriptor_heap](https://docs.vulkan.org/guide/latest/descriptor_heap.html) and are reading this to learn more about the "untyped" (not using the API mapping) workflow.

## Buffer Type

When trying to access an [image](./image_accesses.md) or sampler, SPIR-V uses `OpTypeImage` and `OpTypeSampledImage`. With descriptor heaps, you need a way to point to a Uniform or Storage Buffer. Instead of a `Block`-decorated struct, there is a new `OpTypeBufferEXT`.

As an example, if you had an array of four Storage Buffers bound to different `VkBuffer`s, your SPIR-V will look like:

```swift
// [[storage_buffer]]
// struct Foo {
//     uint a;
//     uint b;
// };
%Foo = OpTypeStruct %uint %uint

// [[descriptor_heap]]
// Foo[4] heap;

// StorageBuffer
%buffer_type = OpTypeBufferEXT StorageBuffer
%heap = OpTypeArray %buffer_type %uint_4
```

## Array Stride with a Constant Size

Sticking with our pseudocode example:

```c
[[descriptor_heap]]
Foo[4] heap;
```

What if we want to have our descriptors strided in the heap like this?

![descriptor_heap_stridded_heap.png](../images/descriptor_heap_stridded_heap.svg)

The issue is that the stride needs to be `0x10`, but that is a runtime value from the client (Vulkan) API.

The new `OpConstantSizeOfEXT` opcode is used to provide the `0x10` at compile time:

```swift
    %type_buffer = OpTypeBufferEXT StorageBuffer
%descriptor_size = OpConstantSizeOfEXT %int %type_buffer
```

From here, we can use `ArrayStrideIdEXT` to set the stride using an `<id>` instead of a normal integer literal.

```swift
// This isn't useful unless you want to ship a different shader for each driver
OpDecorate %heap ArrayStride 16

// With ArrayStrideIdEXT we can use the dynamic value
OpDecorateId %heap ArrayStrideIdEXT %descriptor_size

%descriptor_size = OpConstantSizeOfEXT %int %type_buffer

%heap = OpTypeArray %buffer_type %uint_4
```

> Note: `OpDecorateId` was added in SPIR-V 1.2. This extension adds a similar `OpMemberDecorateIdEXT` instruction as well.

### Array Stride Size

If you have

```swift
%ubo = OpTypeBufferEXT Uniform
%size = OpConstantSizeOfEXT %int %ubo

%ssbo = OpTypeBufferEXT StorageBuffer
%size = OpConstantSizeOfEXT %int %ssbo
```

one might think that the size would be derived from 

```
vkGetPhysicalDeviceDescriptorSizeEXT(UNIFORM_BUFFER);
vkGetPhysicalDeviceDescriptorSizeEXT(STORAGE_BUFFER);
```

but this is incorrect to use the precise size here. 

For the stride, the `bufferDescriptorSize` (or `imageDescriptorSize`/`samplerDescriptorSize`) is used.

Users can still manually provide the precise size (via a spec constants), but `OpConstantSizeOfEXT` is not designed to get the precise size.

## Getting Inside a Buffer Descriptor

Consider the following GLSL code:

```glsl
layout(descriptor_heap) uniform texture2D t[];
layout(descriptor_heap) uniform sampler s[];
layout(descriptor_heap) buffer ssbo {
    uint data;
} b[];
```

When accessing samplers and sampled images, we just need to index into the array. But what if we want to do something like this?

```glsl
layout(descriptor_heap) buffer ssbo {
    uint data;
} b[];

auto descriptor = &b[0];
descriptor.data = 0;
```

We need a way to represent the descriptor variable here as a pointer to a Storage Buffer descriptor. This is where the new `OpBufferPointerEXT` is used.

```swift
%ssbo_struct = OpTypeStruct %uint
%ptr_ssbo = OpTypeUntypedPointerKHR StorageBuffer

// b[0]
%heap_ptr = OpUntypedAccessChainKHR %ptr_uniformConstant %array_type %heap %uint_0

// &b[0]
%buffer_ptr = OpBufferPointerEXT %ptr_ssbo %heap_ptr

// &b[0].data
%data = OpUntypedAccessChainKHR %ptr_ssbo %ssbo_struct %buffer_ptr %uint_0
OpStore %data %uint_0
```

## Offset into the Heap

Imagine we have the following shader:

```glsl
[[storage_buffer]]
struct SSBO {
    uint a;
    uint b;
};

[[descriptor_heap]]
[[offset = sizeof(storage_buffer)]]
Foo[4] heap;
```

Here, we want to start heap at an offset of `0x10` from the base of the descriptor heap, like this:

![descriptor_heap_offset.png](../images/descriptor_heap_offset.svg)

The catch is that `OffsetIdEXT` (which acts just like `Offset`, but can take an `OpConstantSizeOfEXT` value) must be applied to an `OpTypeStruct`.

This means we need to wrap our array in a struct like so:

```glsl
struct HeapLayout {
    [[offset = sizeof(storage_buffer)]]
    Foo[4] heap;
}
```

The resulting SPIR-V becomes:

```swift
OpDecorate %SSBO Block
OpMemberDecorate %SSBO 0 Offset 0
OpMemberDecorate %SSBO 1 Offset 4
%SSBO = OpTypeStruct %uint %uint


OpDecorate %heap_layout Block
OpMemberDecorateIdEXT %heap_layout 0 OffsetIdEXT %descriptor_size

%type_buffer = OpTypeBufferEXT StorageBuffer
%descriptor_size = OpConstantSizeOfEXT %int %type_buffer

%heap = OpTypeArray %type_buffer %uint_4
%heap_layout = OpTypeStruct %heap
```
