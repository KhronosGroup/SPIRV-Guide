#version 460
#extension GL_KHR_memory_scope_semantics : enable
#extension GL_EXT_samplerless_texture_functions : enable
#extension GL_ARB_sparse_texture2 : enable

layout(set = 0, binding = 0, Rgba8ui) uniform uimage2D subpass_image;
layout(input_attachment_index=0, set=0, binding=0) uniform subpassInput subpass_input[2];

layout(set = 0, binding = 1) uniform sampler sampler_descriptor;
layout(set = 0, binding = 2) uniform sampler sampler_array[2];
layout(set = 0, binding = 3) uniform texture2D texture_image;
layout(set = 0, binding = 4) uniform texture2D tex2d_array[2];
layout(set = 0, binding = 5) uniform texture3D tex3d_array[2];
layout(set = 0, binding = 6) uniform texture2DMS texture_imageMS;

layout(set = 0, binding = 7) uniform sampler2D combined_image_sampler;
layout(set = 0, binding = 8) uniform sampler2D combined_image_sampler_array[];

layout(set = 0, binding = 9, rgba8ui) uniform uimageBuffer image_buffer;

layout(set = 0, binding = 10, R32ui) uniform uimage2D atomic_image;

layout(set = 0, binding = 11) uniform samplerCube sampler_cube;

layout(set = 0, binding = 12) uniform textureBuffer texeture_buffer;

layout(set = 0, binding = 13, R32f) uniform image2D sparse_image;

layout(location=0) out vec4 color;

void main() {
    color = subpassLoad(subpass_input[1]);
    color += subpassLoad(subpass_input[0]);
    imageStore(subpass_image, ivec2(1), uvec4(1));
    color += texture(sampler2D(texture_image,  sampler_descriptor), vec2(0.0));
    color += texture(sampler2D(texture_image, sampler_array[1]), vec2(0));
    color += texture(sampler2D(tex2d_array[1], sampler_descriptor), vec2(0));
    color += texture(sampler3D(tex3d_array[1], sampler_descriptor), vec3(0));

    color += texture(combined_image_sampler, vec2(0.0));
    color += texture(combined_image_sampler_array[2], vec2(0.0));

    color += imageLoad(image_buffer, 0);
    imageStore(image_buffer, 0, uvec4(0));

    uint y = imageAtomicLoad(atomic_image, ivec2(0), gl_ScopeDevice, gl_StorageSemanticsImage, gl_SemanticsRelaxed);
    imageAtomicStore(atomic_image, ivec2(0), y, gl_ScopeDevice, gl_StorageSemanticsImage, gl_SemanticsRelaxed);
    imageAtomicExchange(atomic_image, ivec2(0), y, gl_ScopeDevice, gl_StorageSemanticsImage, gl_SemanticsRelaxed);

    color += texelFetch(combined_image_sampler, ivec2(0), 0);

    color += textureGather(sampler_cube, vec3(0.0));
    color += textureGatherOffset(combined_image_sampler, vec2(0.0), ivec2(0));

    int x = textureSize(texeture_buffer);
    x += textureSize(texture_image, 0).x;
    x += textureSize(texture_imageMS).x;
    x += textureQueryLevels(texture_image);
    x += textureSamples(texture_imageMS);
    vec2 lod = textureQueryLod(combined_image_sampler, vec2(0.0));

    vec4 texel = vec4(1.0);
    int resident = 0;
    resident |= sparseTextureARB(combined_image_sampler, vec2(0.0), texel);
    resident |= sparseTextureLodARB(combined_image_sampler, vec2(0.0), 2.0, texel);
    resident |= sparseTexelFetchARB(combined_image_sampler, ivec2(0), 2, texel);
    resident |= sparseImageLoadARB(sparse_image, ivec2(0), texel);

    color += sparseTexelsResidentARB(resident) ? vec4(0.0) : vec4(1.0);
}