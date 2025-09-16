# Storage Class

The [SPIR-V Storage Class](https://registry.khronos.org/SPIR-V/specs/unified1/SPIRV.html#_storage_class) is used to designate the memory to be used for a variables.

## UniformConstant

Arguably the most confusing name, the `UniformConstant` can be viewed as a "opaque handle" to images, samples, raytracing acceleration structures, etc variables.

The handle itself is immutable / read-only, but the data it points to might not be.

The following is an example of writting to a storage image:

```swift
   %type_image = OpTypeImage %uint Buffer 0 0 0 2 Rgba8ui
          %ptr = OpTypePointer UniformConstant %type_image
%storage_image = OpVariable %ptr UniformConstant
         %load = OpLoad %type_image %storage_image
                 OpImageWrite %load %coordinate %texel
```

## Input and Output

These are used for interfacing between shader stages. When working with Vulkan, each shaders in a Graphics pipeline can have input/output variables.

> Note: The Vertex input and Fragment output have special considerations explained in the Vulkan Spec.

## Uniform and StorageBuffer

- `Uniform` is read-only
- `StorageBuffer` is read and write

`StorageBuffer` was added in SPIR-V 1.3, more details and code example can be found in the [Vulkan Guide VK_KHR_storage_buffer_storage_class](https://github.com/KhronosGroup/Vulkan-Guide/blob/main/chapters/extensions/shader_features.adoc#vk_khr_storage_buffer_storage_class) write up.

## Image

This is for pointers into texture storage, for storage buffers. But this is only used for image atomics.

```swift
%type_image = OpTypeImage %uint 2D 0 0 0 2 R32ui
 %image_ptr = OpTypePointer UniformConstant %type_image
 %image_var = OpVariable %image_ptr UniformConstant
  %uint_ptr = OpTypePointer Image %uint
      %ssbo = OpAccessChain %ssbo_ptr %base %index_0
     %value = OpLoad %uint %ssbo
 %texel_ptr = OpImageTexelPointer %uint_ptr %image_var %coordinate %sample
%atomic_add = OpAtomicIAdd %uint %texel_ptr %memory %semantics %value
```

`OpImageTexelPointer` description says "Use of such a pointer is limited to atomic operations".

## Interfacing with Vulkan

There is a [table in the Vulkan Spec](https://docs.vulkan.org/spec/latest/chapters/interfaces.html#interfaces-resources-storage-class-correspondence) the maps which Vulkan resource types to each SPIR-V Storage Class. There is also a [Vulkan Guide Chapter](https://github.com/KhronosGroup/Vulkan-Guide/blob/main/chapters/mapping_data_to_shaders.adoc) with examples.
