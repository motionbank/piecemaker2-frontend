task :default do
  exec "rake -T"
end

desc "Start|Stop HTTP server for static file serving"
task :daemon, :action do |cmd, args|

  def pid_exist?(pid)
    begin
      return Process.getpgid(pid)
    rescue
      return false
    end
  end

  def check_pid_file
    if File.exist?("rack.pid")
      # pid file exists: api running?
      pid = IO.read("rack.pid").to_i

      if(pid_exist?(pid))
        puts "frontend http server is running (PID: #{pid})"
        exit 0
      end

      # pid file exists, but process crashed maybe
      # anyway, delete pid file
      File.delete("rack.pid")
    end
  end

  if args[:action] == "start"
    check_pid_file

    # no process is running ... start a new one
    system "rackup -E production -D -P rack.pid --port 50726 rack.ru > rack_http_server.log"
    sleep 0.5
    check_pid_file

    # if you reached this, api was not started
    puts "frontend http server not running"
    exit 50

  elsif args[:action] == "stop"
    if File.exist?("rack.pid")
      pid = IO.read("rack.pid").to_i
      if(pid_exist?(pid))
        system "kill $(cat rack.pid)"
        File.delete("rack.pid")
        exit 0
      end
    end
    exit 0
  elsif args[:action] == "status"
    check_pid_file

    # if you reached this, api was not started
    puts "frontend http server not running"
    exit 50
  end
end