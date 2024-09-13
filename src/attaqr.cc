#include <napi.h>
#include "attaqr.h"

AQPixel AQMakePixel(uint8_t r, uint8_t g, uint8_t b)
{
  AQPixel pixel;
  pixel.r = r;
  pixel.g = g;
  pixel.b = b;
  return pixel;
};

Napi::Value _getPixel(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  if (info.Length() == 2)
  {
    size_t x = info[0].As<Napi::Number>().Int32Value();
    size_t y = info[1].As<Napi::Number>().Int32Value();

    AQPixel pixel = getPixel(x, y);

    Napi::Object obj = Napi::Object::New(env);
    obj.Set(Napi::String::New(env, "r"), Napi::Number::New(env, pixel.r));
    obj.Set(Napi::String::New(env, "g"), Napi::Number::New(env, pixel.g));
    obj.Set(Napi::String::New(env, "b"), Napi::Number::New(env, pixel.b));

    // Return our object with .width and .height.
    return obj;
  }
  else
  {
    Napi::TypeError::New(env, "Expected 2 arguments").ThrowAsJavaScriptException();
    return env.Null();
  }
}

void _pressKey(const Napi::CallbackInfo &info)
{
  Napi::Number key = info[0].As<Napi::Number>();
  int flags = MOD_NONE;

  if (info.Length() == 2 && info[1].IsArray())
  {
    Napi::Array modList = info[1].As<Napi::Array>();
    for (uint32_t i = 0; i < modList.Length(); ++i)
    {
      std::string modString = modList.Get(i).As<Napi::String>();
      if (modString.compare("alt") == 0)
      {
        flags |= KEY_ALT;
      }
      else if (modString.compare("shift") == 0)
      {
        flags |= KEY_SHIFT;
      }
      else if (modString.compare("ctrl") == 0)
      {
        flags |= KEY_CONTROL;
      }
      Napi::Env env = info.Env();
      Napi::Function consoleLog = env.Global().Get("console").As<Napi::Object>().Get("log").As<Napi::Function>();
      consoleLog.Call({ Napi::String::New(env, modString), Napi::Number::New(env, flags) });
    }
  }
  pressKey(key, flags);
}

Napi::Object InitAll(Napi::Env env, Napi::Object exports)
{
  exports.Set("getPixel", Napi::Function::New(env, _getPixel));
  exports.Set("pressKey", Napi::Function::New(env, _pressKey));
  return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, InitAll)
