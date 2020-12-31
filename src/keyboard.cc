#include <napi.h>
#include "os.h"

#if defined(IS_MACOS)
#include <ApplicationServices/ApplicationServices.h>
#elif defined(IS_WIN32)
#include <Windows.h>
#endif

int MOD_NONE = 0;

#if defined(IS_MACOS)
int MOD_ALT = kCGEventFlagMaskAlternate;
int MOD_CONTROL = kCGEventFlagMaskControl;
int MOD_SHIFT = kCGEventFlagMaskShift;
#endif

void pressKey(int key, int flags);

#if defined(IS_MACOS)

void pressKey(int key, int flags)
{
  CGEventRef evt = CGEventCreateKeyboardEvent(NULL, (CGKeyCode)key, kCGEventKeyDown);
  CGEventSetFlags(evt, flags);
  CGEventPost(kCGHIDEventTap, evt);
  CGEventSetType(evt, kCGEventKeyUp);
  CGEventPost(kCGHIDEventTap, evt);
  CFRelease(evt);
}

#elif defined(IS_WIN32)

void pressKey(int key, int flags)
{
  INPUT input = {0};
  input.type = INPUT_KEYBOARD;
  input.ki.wVk = key;
  // TODO: Add mod flags
  SendInput(1, &input, sizeof(INPUT));
  input.ki.dwFlags = KEYEVENTF_KEYUP;
  SendInput(1, &input, sizeof(INPUT));
}

#endif

void _pressKey(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
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

Napi::Object Init(Napi::Env env, Napi::Object exports)
{
  exports.Set("pressKey", Napi::Function::New(env, _pressKey));
  return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)