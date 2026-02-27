package com.mecanotun.mobile;

import android.util.SparseArray;
import android.util.SparseIntArray;
import android.view.View;
import androidx.databinding.DataBinderMapper;
import androidx.databinding.DataBindingComponent;
import androidx.databinding.ViewDataBinding;
import com.mecanotun.mobile.databinding.ActivityBookAppointmentBindingImpl;
import com.mecanotun.mobile.databinding.ActivityHomeBindingImpl;
import com.mecanotun.mobile.databinding.ActivityLoginBindingImpl;
import com.mecanotun.mobile.databinding.ActivityProfileBindingImpl;
import com.mecanotun.mobile.databinding.ActivityServicesBindingImpl;
import com.mecanotun.mobile.databinding.ActivitySignupBindingImpl;
import java.lang.IllegalArgumentException;
import java.lang.Integer;
import java.lang.Object;
import java.lang.Override;
import java.lang.RuntimeException;
import java.lang.String;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public class DataBinderMapperImpl extends DataBinderMapper {
  private static final int LAYOUT_ACTIVITYBOOKAPPOINTMENT = 1;

  private static final int LAYOUT_ACTIVITYHOME = 2;

  private static final int LAYOUT_ACTIVITYLOGIN = 3;

  private static final int LAYOUT_ACTIVITYPROFILE = 4;

  private static final int LAYOUT_ACTIVITYSERVICES = 5;

  private static final int LAYOUT_ACTIVITYSIGNUP = 6;

  private static final SparseIntArray INTERNAL_LAYOUT_ID_LOOKUP = new SparseIntArray(6);

  static {
    INTERNAL_LAYOUT_ID_LOOKUP.put(com.mecanotun.mobile.R.layout.activity_book_appointment, LAYOUT_ACTIVITYBOOKAPPOINTMENT);
    INTERNAL_LAYOUT_ID_LOOKUP.put(com.mecanotun.mobile.R.layout.activity_home, LAYOUT_ACTIVITYHOME);
    INTERNAL_LAYOUT_ID_LOOKUP.put(com.mecanotun.mobile.R.layout.activity_login, LAYOUT_ACTIVITYLOGIN);
    INTERNAL_LAYOUT_ID_LOOKUP.put(com.mecanotun.mobile.R.layout.activity_profile, LAYOUT_ACTIVITYPROFILE);
    INTERNAL_LAYOUT_ID_LOOKUP.put(com.mecanotun.mobile.R.layout.activity_services, LAYOUT_ACTIVITYSERVICES);
    INTERNAL_LAYOUT_ID_LOOKUP.put(com.mecanotun.mobile.R.layout.activity_signup, LAYOUT_ACTIVITYSIGNUP);
  }

  @Override
  public ViewDataBinding getDataBinder(DataBindingComponent component, View view, int layoutId) {
    int localizedLayoutId = INTERNAL_LAYOUT_ID_LOOKUP.get(layoutId);
    if(localizedLayoutId > 0) {
      final Object tag = view.getTag();
      if(tag == null) {
        throw new RuntimeException("view must have a tag");
      }
      switch(localizedLayoutId) {
        case  LAYOUT_ACTIVITYBOOKAPPOINTMENT: {
          if ("layout/activity_book_appointment_0".equals(tag)) {
            return new ActivityBookAppointmentBindingImpl(component, view);
          }
          throw new IllegalArgumentException("The tag for activity_book_appointment is invalid. Received: " + tag);
        }
        case  LAYOUT_ACTIVITYHOME: {
          if ("layout/activity_home_0".equals(tag)) {
            return new ActivityHomeBindingImpl(component, view);
          }
          throw new IllegalArgumentException("The tag for activity_home is invalid. Received: " + tag);
        }
        case  LAYOUT_ACTIVITYLOGIN: {
          if ("layout/activity_login_0".equals(tag)) {
            return new ActivityLoginBindingImpl(component, view);
          }
          throw new IllegalArgumentException("The tag for activity_login is invalid. Received: " + tag);
        }
        case  LAYOUT_ACTIVITYPROFILE: {
          if ("layout/activity_profile_0".equals(tag)) {
            return new ActivityProfileBindingImpl(component, view);
          }
          throw new IllegalArgumentException("The tag for activity_profile is invalid. Received: " + tag);
        }
        case  LAYOUT_ACTIVITYSERVICES: {
          if ("layout/activity_services_0".equals(tag)) {
            return new ActivityServicesBindingImpl(component, view);
          }
          throw new IllegalArgumentException("The tag for activity_services is invalid. Received: " + tag);
        }
        case  LAYOUT_ACTIVITYSIGNUP: {
          if ("layout/activity_signup_0".equals(tag)) {
            return new ActivitySignupBindingImpl(component, view);
          }
          throw new IllegalArgumentException("The tag for activity_signup is invalid. Received: " + tag);
        }
      }
    }
    return null;
  }

  @Override
  public ViewDataBinding getDataBinder(DataBindingComponent component, View[] views, int layoutId) {
    if(views == null || views.length == 0) {
      return null;
    }
    int localizedLayoutId = INTERNAL_LAYOUT_ID_LOOKUP.get(layoutId);
    if(localizedLayoutId > 0) {
      final Object tag = views[0].getTag();
      if(tag == null) {
        throw new RuntimeException("view must have a tag");
      }
      switch(localizedLayoutId) {
      }
    }
    return null;
  }

  @Override
  public int getLayoutId(String tag) {
    if (tag == null) {
      return 0;
    }
    Integer tmpVal = InnerLayoutIdLookup.sKeys.get(tag);
    return tmpVal == null ? 0 : tmpVal;
  }

  @Override
  public String convertBrIdToString(int localId) {
    String tmpVal = InnerBrLookup.sKeys.get(localId);
    return tmpVal;
  }

  @Override
  public List<DataBinderMapper> collectDependencies() {
    ArrayList<DataBinderMapper> result = new ArrayList<DataBinderMapper>(1);
    result.add(new androidx.databinding.library.baseAdapters.DataBinderMapperImpl());
    return result;
  }

  private static class InnerBrLookup {
    static final SparseArray<String> sKeys = new SparseArray<String>(2);

    static {
      sKeys.put(0, "_all");
      sKeys.put(1, "viewModel");
    }
  }

  private static class InnerLayoutIdLookup {
    static final HashMap<String, Integer> sKeys = new HashMap<String, Integer>(6);

    static {
      sKeys.put("layout/activity_book_appointment_0", com.mecanotun.mobile.R.layout.activity_book_appointment);
      sKeys.put("layout/activity_home_0", com.mecanotun.mobile.R.layout.activity_home);
      sKeys.put("layout/activity_login_0", com.mecanotun.mobile.R.layout.activity_login);
      sKeys.put("layout/activity_profile_0", com.mecanotun.mobile.R.layout.activity_profile);
      sKeys.put("layout/activity_services_0", com.mecanotun.mobile.R.layout.activity_services);
      sKeys.put("layout/activity_signup_0", com.mecanotun.mobile.R.layout.activity_signup);
    }
  }
}
