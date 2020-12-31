{ 
  "targets": [ 
    { 
      "target_name": "addon", 
      "sources": [ "src/addon.cc" ],
      "include_dirs": [ "<!@(node -p \"require('node-addon-api').include\")", "src" ],
      "dependencies": [ "<!(node -p \"require('node-addon-api').gyp\")" ],
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS"],
      "conditions": [
        [ 'OS=="mac"', {
          "sources": [ "src/macos/keyboard.cc", "src/macos/screen.cc"],
        }],
        [ 'OS=="win"', {
          "sources": [ "src/windows/keyboard.cc", "src/windows/screen.cc"]
        }]
      ]
    }
  ]
}
