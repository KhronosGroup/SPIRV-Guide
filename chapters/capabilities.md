# Overview of the Capabilities system

Because SPIR-V can be consumed by multiple client APIs, which have different requirements, there needs to be a way to distinguish what is valid for each API. The [capabilities](https://registry.khronos.org/SPIR-V/specs/unified1/SPIRV.html#_a_id_capabilities_a_language_capabilities) system is used to establish what is "features" are valid.

> Example: Something such as [Builtin::PrimitiveId](https://registry.khronos.org/SPIR-V/specs/unified1/SPIRV.html#_a_id_builtin_a_builtin) will not be found in a compute API such as OpenCL, therefore the capabilities prevent an OpenCL targeted SPIR-V module from being valid if the `PrimitiveId` builtin is used.

It is up to the client API to properly expose any capabilities that are supported ([Vulkan example](https://github.com/KhronosGroup/Vulkan-Guide/blob/main/chapters/spirv_extensions.adoc)).
