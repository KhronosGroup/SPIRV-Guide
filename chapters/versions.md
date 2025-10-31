# Versions

SPIR-V has various versions currently, starting at 1.0, then 1.1, 1.2, etc.

There is currently no 2.0 and everything is still backward compatible.

SPIR-V is built as an unified specification, therefore you will always see the latest version as there is no real need to view an older SPIR-V version specification.

## Where versions matter

The most common source of confusion for SPIR-V version is when it comes to `spirv-val`. While the SPIR-V instructions are backward compatible, the rules what is valid or invalid slightly changes over time.

### Example - Validation of OpEntryPoint

In SPIR-V 1.0, your `OpEntryPoint` only needed the `Interface <id>` operands for the `Input`/`Output` variables, starting in SPIR-V 1.4, it was enforced that all storage classes of variables used must be in the `Interface <id>` operands too.

Taking some basic GLSL code of

```glsl
layout(set = 0, binding = 0) buffer SSBO { uint x; };
```

the following is valid 1.0 SPIR-V, but invalid 1.4+ SPIR-V

```swift
OpEntryPoint GLCompute %main "main"

%var = OpVariable %_ptr_ssbo Uniform
```

but if you generate the following it will be valid for **all versions** of SPIR-V

```patch
+ OpEntryPoint GLCompute %main "main" %var
- OpEntryPoint GLCompute %main "main"

%var = OpVariable %_ptr_ssbo Uniform
```

### Taking caution when generating code

Using glslang as an example, it provides a `--target-env` argument to decide which version of SPIR-V it should generate.

We can examine in https://godbolt.org/z/nn159rex6 the `OpEntryPoint` is different.

So when using `spirv-val` we need to make sure the correct `--target-env` is passed in (see https://godbolt.org/z/x3Mc7GGfr)

> If you are using a runtime tool, such as the Vulkan Validation Layers, it will pass in the `VkApplicationInfo::apiVersion` for you as the `--target-env`
