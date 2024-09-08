# Image Accesses

SPIR-V has various [Image Instructions](https://registry.khronos.org/SPIR-V/specs/unified1/SPIRV.html#_image_instructions) that take will interact with `OpTypeImage`. This chapter aims to give some extra context around these instructions.

> There is an [example.frag](./examples/image_accesses/example.frag) (and [example.spv](./examples/image_accesses/example.spv)) GLSL shader that has an example of various ways images can be accessed in SPIR-V.

# Sampled Images

When using a sampler, you must have a `OpTypeSampledImage` object, this will be directly pointing to a `OpTypeImage` object.

To access the sampled image you will use a `OpImage*Sample*` instruction (ex. `OpImageSampleImplicitLod`) to get a `OpSampledImage`. (It can also use a `OpImage*Gather` as well)

![image_access_sampled_image.png](../images/image_access_sampled_image.png)

## Fetch

There are also `OpImageFetch` (and `OpImageSparseFetch`) instructions which work similar as `OpImage*Sample*`.

While the `OpImage*Sample*` takes float coordinates and does a lookup to get the texel, the `OpImageFetch` takes image coordinate to the exact texel to return.

This means an `OpImageFetch` will directly access through an `OpImage` and doesn't need an `OpSampledImage` object.

# Non-sampled image

When not using a sampler (ex. storage image), you can directly use an `OpTypeImage` object.

> Note you will **not** be using an `OpImage` when accessing an image without a sampler. The `OpImage` is designed to point to the image of the sampler/image combination.

The `OpImageRead` and `OpImageWrite` will directly go to the `OpLoad` into the variable.

![image_access_storage_image.png](../images/image_access_storage_image.png)

> The `OpImageWrite` calls `OpLoad` but this is **not** an image "read access". The `OpLoad` just grabs the reference, but there is only a "write access" here on the image.

# Image Queries

There are some `OpImageQuery*` instructions that are designed to directly access an `OpTypeImage` object. The image itself is not accessed.

## OpImageTexelPointer

Before you do an operation such as an atomic image load, you need to get a pointer for the memory.

The `OpImageTexelPointer` allows you take a texel inside an image, and create a pointer to it which can be accessed by an atomic image operation.

Example: `OpAtomicLoad -> OpImageTexelPointer -> OpVariable`

## OpImageSparseTexelsResident

When dealing with sparse textures, you can have some memory that is not actually available to access. Before trying to access it, we will want to query to make sure it is safe.

By calling `OpImageSparseTexelsResident` it will return a `true`/`false` to let you know if the access is available.

The important part for those consuming SPIR-V is while this instruction name starts with `OpImage*`, it does **not** actually access the image at all.
