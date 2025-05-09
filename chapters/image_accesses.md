# Image Accesses

SPIR-V has various [Image Instructions](https://registry.khronos.org/SPIR-V/specs/unified1/SPIRV.html#_image_instructions) that interact with `OpTypeImage`. This chapter aims to give some extra context around these instructions.

> There is an [example.frag](./examples/image_accesses/example.frag) (and [example.spv](./examples/image_accesses/example.spv)) GLSL shader that has an example of various ways images can be accessed in SPIR-V. [Online Compiler Explorer version](https://godbolt.org/z/d3shn8675)

# Coordinate Systems

It is important to know there are 3 texel coordinate systems used for images:

- Normalized (float values from [0, 1])
- Unnormalized (float value from [0, image size in each dimension])
- Integers

The SPIR-V spec documents which instructions are allowed to use which coordinate system.
The [Vulkan Spec Texel Coordinate Systems Chapter](https://registry.khronos.org/vulkan/specs/1.3-extensions/html/vkspec.html#textures-texel-coordinate-systems) is a good resource to learn more about this.

When using a `vec4` (4 wide vector) as a coordinate, the API spec defines what each vector element represents. As an example, in Vulkan, when using Unnormalized coordinates, the `vec4.z` element is the value of the `array layer`.

# Images as Handles

An `OpTypeImage` can be thought of as a handle to the underlying texel data. To help illustrate this, here is a small program that writes to an image

```glsl
layout(set = 0, binding = 1, rgba8) uniform writeonly image2D image;
void main() {
    imageStore(image, ivec2(0, 0), vec4(1.0));
}
```

Taking a closer look at the `OpVariable` we see it is in the [UniformConstant](../chapters/storage_class.md#uniformconstant) Storage Class which is suppose to be "read-only" (yet there is a clear `OpImageWrite` occuring here).

This is possible because the handle to the image is read-only, but the underlying texel data of the image is mutable.

A software mental model of the `OpTypeImage` is to think of it as container that holds metadata while also holding the data of the image.

```c++
struct ImageType {
  bool depth;
  bool arrayed;
  bool sampled;
  bool multisampled;
  Format format;
  int width;
  // other metadata ...
  void* texels; // data of the image (which is mutable)
}
```

The above `OpVariable` is read-only because we are not allowed to adjust its format, width, or multisampling state ever.

# Sampled Images

When using a sampler, you must have an `OpTypeSampledImage` object, this will be directly pointing to an image object of `OpTypeImage`.

## Combined Image Samplers

The `Input` `OpVariable` can sometimes contain both the Sampler and Image (Vulkan calls these `VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER`). 

When these variables are loaded, they will be of type `OpTypeSampledImage`.

## Non-Combined Sampled Images

The `OpSampledImage` instruction is used to create a sampled image, from two seperate `OpVariable` (one image and one sampler).

To access the sampled image you will use an `OpImage*Sample*` instruction (ex. `OpImageSampleImplicitLod`).

![image_access_sampled_image.png](../images/image_access_sampled_image.png)

> [Simple example of combined and non-combined sampled images](https://godbolt.org/z/rhnTWGrdG)

## Fetch

There are also `OpImageFetch` (and `OpImageSparseFetch`) instructions which work similar as `OpImage*Sample*`.

The `OpImageFetch` only takes integer texel coordinates. The texture data is read directly without any sampling operations.

This means the `OpImageFetch` instruction will directly access through an object of type `OpTypeImage` and doesn't need an `OpTypeSampledImage` object directly.

# Non-sampled image

When not using a sampler (ex. storage image), you can directly use an loaded image object of `OpTypeImage`.

Instructions such as `OpImageRead` and `OpImageWrite` will use the result of a `OpLoad`.
This `OpLoad` will be loading in a variable of type image (`OpTypeImage`).

![image_access_storage_image.svg](../images/image_access_storage_image.svg)

## Loading handle vs loading texel

The following code/diagram shows an example how an `OpImageWrite` instruction is used.

![image_access_handle.svg](../images/image_access_handle.svg)

From the code, we see that the `OpImageWrite` calls `OpLoad` to load the the handle (`image_view_a`/`image_view_b`).
From there is then does a "write" to update the texel data.
The "write" did not update the handle/pointer, but the texel data itself.
This means there was no "read access" texel data.

SPIR-V has decorations for `NonReadable`/`NonWritable` that can be applied to an image as well.
These decorations are applied to the texel data, not to the handles.

# OpImage

With many other things also starting with `OpImage*` it is easy to lose track what `OpImage` is for. As the spec says simply:

>  [OpImage] Extract the image from a sampled image.

The `OpImage` instruction extracts image object of `OpTypeImage` from an `OpTypeSampledImage`.

The `OpImage` instruction is describing an action, rather than the input to or the output from an action.

The `OpImage` instruction is useful if you have an object of type `OpTypeSampledImage` and you need an object of type `OpTypeImage`. (example, accessing the image data without a sampler.)

# Image Queries

There are some `OpImageQuery*` instructions that are designed to access metadata from image object of `OpTypeImage`.

```swift
// Example
%type_image = OpTypeImage %int 2D 0 0 1 1 Unknown
%var = OpVariable %ptr UniformConstant
%load = OpLoad %type_image %var
%query = OpImageQuerySize %int %load
```

The texel data itself is not accessed.
For cases such as `OpImageQueryLod`, the actual operation is not performed.

## OpImageTexelPointer

Before you do an operation such as an atomic image load, you need to get a pointer for the memory.

The `OpImageTexelPointer` allows you to take a texel inside an image, and create a pointer to it which can be accessed by an atomic image operation.

Example: `OpAtomicLoad -> OpImageTexelPointer -> OpVariable`

To see this in practice we can view the difference between a `imageAtomicStore` and `imageStore` call

```swift
%1 = OpImageTexelPointer %OpTypePointer %atomic_image %coor %sample
     OpAtomicStore %1 %_ %_ %scalar_value

%2 = OpLoad %OpTypeImage %image
     OpImageWrite %2 %coor %texel
```

While the `OpLoad` returns an image object of `OpTypeImage` that we store the new texel, with `OpImageTexelPointer` we get a direct pointer to the texel data and can store scalar value like `OpConstant %int 0`. This is posssible because the `Coordinate` operand is supplied in the `OpImageTexelPointer` instead afterwards in the actual "write" operation.

You are not expected to do any pointer math on the pointer returned by `OpImageTexelPointer`.
To get a pointer to a different texel, you should call `OpImageTexelPointer` again, with a different coordinate.

## OpImageSparseTexelsResident

When dealing with sparse textures, you can have some memory that is not actually available to access. Before trying to access it, we will want to query to make sure it is safe.

By calling `OpImageSparseTexelsResident` it will return a `true`/`false` to let you know if the access is available.

The important part for those consuming SPIR-V is while this instruction name starts with `OpImage*`, it does **not** actually access the image at all.
