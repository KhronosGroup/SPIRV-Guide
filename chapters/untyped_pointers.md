# Untyped Pointers

The motivation for [SPV_KHR_untyped_pointers](https://github.khronos.org/SPIRV-Registry/extensions/KHR/SPV_KHR_untyped_pointers.html) is based on the recognition that explicit pointee types carried no real semantic value. Having a `int* ptr` really can just be a `void* ptr` as it can always be cast (with `OpBitcast`). The core idea of untyped pointers is that until you make the memory access (`OpLoad`, `OpStore`, etc) the type is not needed. This matches the mental model of using things like C++ templates or unions.

This idea can also be found in the LLVM community, which has moved to `Opaque Pointers` starting in LLVM 15.

> More information can be found in https://github.com/KhronosGroup/Vulkan-Docs/blob/main/proposals/VK_KHR_shader_untyped_pointers.adoc

# What the extension adds

This extension adds various `Untyped` instructions, such as:

- Op**Untyped**VariableKHR`
- Op**Untyped**AccessChainKHR`
- OpType**Untyped**PointerKHR`

> `OpTypeUntypedPointerKHR` may seem strange, but it follows the `OpType*` convention and is just unfortunate the "type" and "untyped" are both in the name

# Rethinking the pointer type

The better understand this extension, first focus on `OpTypeUntypedPointerKHR` as that is the "core" change. By using this new pointer type, you will find the reason the other "untyped" instructions were added to go along with it.

Let's use this very basic example of load and storing to a storage buffer ([view online](https://godbolt.org/z/5Wx1PsxG7)):

```glsl
layout(set = 0, binding = 0) buffer SSBO {
    uint a;
};

void main() {
    uint b = a;
    a = 0;
}
```

This will generate into something such as

```swift
   %uint = OpTypeInt 32 0
 %uint_0 = OpConstant %uint 0

 %ptr = OpTypePointer StorageBuffer %uint

    %SSBO = OpTypeStruct %uint
%SSBO_ptr = OpTypePointer StorageBuffer %SSBO
%variable = OpVariable %SSBO_ptr StorageBuffer

  %ac = OpAccessChain %ptr %variable %uint_0
%load = OpLoad %uint %ac
        OpStore %ac %uint_0
```

Notice that `OpLoad` and `OpStore` both have two operands, and **both** can figure out the type is `%uint`. This is the **core motivation** of this extension, to remove the need for having to declare the `%uint` type here in the `Pointer` operand.

With untyped pointer, we still want will use the access chain to get the `StorageClass`, but we can now remove the redundancy by first turning the pointer into an untyped pointer.

```diff
   %uint = OpTypeInt 32 0
 %uint_0 = OpConstant %uint 0

- %ptr = OpTypePointer StorageBuffer %uint
+ %ptr = OpTypeUntypedPointerKHR StorageBuffer

    %SSBO = OpTypeStruct %uint
%SSBO_ptr = OpTypePointer StorageBuffer %SSBO
%variable = OpVariable %SSBO_ptr StorageBuffer

  %ac = OpAccessChain %ptr %variable %uint_0
%load = OpLoad %uint %ac
        OpStore %ac %uint_0
```

But this is **stil invalid**! We now need a matching untyped access chain as well where we now have a new `Base Type` operand.

```diff
   %uint = OpTypeInt 32 0
 %uint_0 = OpConstant %uint 0

 %ptr = OpTypeUntypedPointerKHR StorageBuffer

    %SSBO = OpTypeStruct %uint
%SSBO_ptr = OpTypePointer StorageBuffer %SSBO
%variable = OpVariable %SSBO_ptr StorageBuffer

-  %ac = OpAccessChain %ptr %variable %uint_0
+  %ac = OpUntypedAccessChainKHR %ptr %SSBO %variable %uint_0
%load = OpLoad %uint %ac
        OpStore %ac %uint_0
```

From here, we can now go an extra step and turn the `OpVariable` into an untyped variable as it now doesn't requires to be tied to a pointer anymore.

This is the same mental model of taking a `ssbo* ptr` and now making it `void* ptr`

> Note, the following is an optional step. To facilitate transitions, untyped pointer opcodes generally support the input pointers being typed or untyped and generate an untyped result.

```diff
   %uint = OpTypeInt 32 0
 %uint_0 = OpConstant %uint 0

 %ptr = OpTypeUntypedPointerKHR StorageBuffer

    %SSBO = OpTypeStruct %uint
-%SSBO_ptr = OpTypePointer StorageBuffer %SSBO
-%variable = OpVariable %SSBO_ptr StorageBuffer
+%variable = OpUntypedVariableKHR %ptr StorageBuffer %SSBO

  %ac = OpUntypedAccessChainKHR %ptr %SSBO %variable %uint_0
%load = OpLoad %uint %ac
        OpStore %ac %uint_0
```

And with that, we are done and have now turned the original SPIR-V to using untyped pointers and still have the same semantic meaning.

> Final SPIR-V https://godbolt.org/z/1n9bffq4d

## Indexing at zero

Since the above example has all the indexes with the constant value of zero, we can actually go another step further. The `%uint_0` was only necessary prior with typed pointers to satisfy type rules. With untyped pointers, we can directly point to the variable

```diff
   %uint = OpTypeInt 32 0
 %uint_0 = OpConstant %uint 0

 %ptr = OpTypeUntypedPointerKHR StorageBuffer

    %SSBO = OpTypeStruct %uint
%variable = OpUntypedVariableKHR %ptr StorageBuffer %SSBO

-  %ac = OpUntypedAccessChainKHR %ptr %SSBO %variable %uint_0
-%load = OpLoad %uint %ac
-        OpStore %ac %uint_0
+%load = OpLoad %uint %variable
+        OpStore %variable %uint_0
```

> Adjusted final SPIR-V https://godbolt.org/z/47nqsG7Wc

### Multiple zero indexing

This applies to any amount of trailing zero indices, even if there are non-zero preceding indices.

For something like:

```glsl
struct S {
  int x;
  int a[4][4][4];
};
S s;
```

The following accesses are all at the same offset and, thus, equivalent access chains:

```
s.a[0]
s.a[0][0]
s.a[0][0][0]
```

# Removing accidental assumptions

What people parsing SPIR-V need to care about is where, by accident, they are getting the type from the `OpTypePointer`.

For `OpLoad`, use the `Result Type` operand instead of the `Pointer` operand. This applies to all memory loads (`OpCooperativeMatrixLoadKHR`, `OpAtomicIAdd`, etc)

For `OpStore`, use the type of the value being stored (e.g. type of `Object` operand) instead of the `Pointer` operand. This applies to all memory stores (`OpCooperativeMatrixStoreKHR`, `OpAtomicStore`, etc)

For `OpCopyMemory`, either the `Source` or `Target` operand will contain a `OpTypePointer` still.

For `OpCopyMemorSized`, both the `Source` and `Target` could be an untyped pointer, in this case, it interprets the data as an array of 8-bit integers.

For `OpVariable`, there is an optional `Data Type` in the `OpUntypedVariableKHR` to check. If you are using `Shader` (Vulkan) then this is [required the be there](https://docs.vulkan.org/spec/latest/appendices/spirvenv.html#VUID-StandaloneSpirv-OpUntypedVariableKHR-11167).

If you are trying to get the `OpTypePointer` from the `OpAccessChain`, the fix will depend on what your goal is. The `OpUntypedAccessChainKHR` has a `Base Type` that instructs how the indexes are interpreted. If the `OpAccessChain` is only used from a memory instruction (`OpLoad`, `OpStore`, etc) and as listed above, the type can be found from there already.