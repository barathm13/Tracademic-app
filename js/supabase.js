/*
  Smart Student Tracker Supabase helper
  -------------------------------------------------------------
  1. Create a Supabase project.
  2. Run sql/schema.sql in the Supabase SQL editor.
  3. Replace the placeholders below with your Project URL and anon key.
*/
(function () {
  const SUPABASE_URL = 'https://bwglxvkruopyyesfklys.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Z2x4dmtydW9weXllc2ZrbHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NTkxMDMsImV4cCI6MjA5NDIzNTEwM30.g_djmwNKTV9z1aUCXOLyDeBXzlGJFjCsWB30n5BFyOs';

  const isConfigured = !SUPABASE_URL.includes('YOUR-PROJECT-REF') && !SUPABASE_ANON_KEY.includes('YOUR-SUPABASE-ANON-KEY');
  const client = isConfigured && window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      })
    : null;

  function getClient() {
    if (!client) {
      throw new Error('Supabase is not configured. Update SUPABASE_URL and SUPABASE_ANON_KEY in js/supabase.js.');
    }
    return client;
  }

  async function getSession() {
    const { data, error } = await getClient().auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function getUser() {
    const { data, error } = await getClient().auth.getUser();
    if (error) throw error;
    return data.user;
  }

  async function signUp(name, email, password) {
    const { data, error } = await getClient().auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/login.html`
      }
    });
    if (error) throw error;

    // If email confirmation is disabled, a session exists and the profile can be upserted immediately.
    // If confirmation is enabled, sql/schema.sql also creates a trigger that safely creates this profile.
    if (data.session && data.user) {
      await upsertProfile(data.user.id, name, email);
    }

    return data;
  }

  async function login(email, password) {
    const { data, error } = await getClient().auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function logout() {
    const { error } = await getClient().auth.signOut();
    if (error) throw error;
  }

  async function upsertProfile(id, name, email) {
    const { data, error } = await getClient()
      .from('profiles')
      .upsert({ id, name, email }, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function getProfile(userId) {
    const { data, error } = await getClient()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  }

  async function getTasks(userId) {
    const { data, error } = await getClient()
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function createTask(task) {
    const { data, error } = await getClient()
      .from('tasks')
      .insert(task)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function updateTask(id, updates) {
    const { data, error } = await getClient()
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function deleteTask(id) {
    const { error } = await getClient().from('tasks').delete().eq('id', id);
    if (error) throw error;
  }

  async function getAttendance(userId) {
    const { data, error } = await getClient()
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function markAttendance(userId, date, status) {
    const { data, error } = await getClient()
      .from('attendance')
      .insert({ user_id: userId, date, status })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  window.StudentTracker = {
    isConfigured,
    supabase: client,
    auth: { getSession, getUser, signUp, login, logout },
    db: {
      upsertProfile,
      getProfile,
      getTasks,
      createTask,
      updateTask,
      deleteTask,
      getAttendance,
      markAttendance
    }
  };
})();
