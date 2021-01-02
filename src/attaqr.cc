#include <napi.h>
#include "attaqr.h"
#include "keyboard.h"
#include "screen.h"

AQPoint AQMakePoint(size_t x, size_t y)
{
  AQPoint point;
  point.x = x;
  point.y = y;
  return point;
};

AQSize AQMakeSize(size_t height, size_t width)
{
  AQSize size;
  size.height = height;
  size.width = width;
  return size;
};

AQRect AQMakeRect(size_t x, size_t y, size_t h, size_t w)
{
  AQRect rect;
  rect.origin = AQMakePoint(x, y);
  rect.size = AQMakeSize(h, w);
  return rect;
};

void _captureScreen(const Napi::CallbackInfo &info)
{
  CaptureWorker *worker;
  if (info.Length() == 1)
  {
    Napi::Function cb = info[0].As<Napi::Function>();
    worker = new CaptureWorker(cb);
  }
  else
  {
    AQRect rect = AQMakeRect(
      (uint32_t)info[0].As<Napi::Number>(),
      (uint32_t)info[1].As<Napi::Number>(),
      (uint32_t)info[2].As<Napi::Number>(),
      (uint32_t)info[3].As<Napi::Number>()
    );
    Napi::Function cb = info[4].As<Napi::Function>();
    worker = new CaptureWorker(rect, cb);
  }
  worker->Queue();
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
        flags |= MOD_ALT;
      }
      else if (modString.compare("shift") == 0)
      {
        flags |= MOD_SHIFT;
      }
      else if (modString.compare("control") == 0)
      {
        flags |= MOD_CONTROL;
      }
    }
  }
  pressKey(key, flags);
}

Napi::Object InitAll(Napi::Env env, Napi::Object exports)
{
  exports.Set("captureScreen", Napi::Function::New(env, _captureScreen));
  exports.Set("pressKey", Napi::Function::New(env, _pressKey));
  return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, InitAll)
