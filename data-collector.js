const sysinfo = require('systeminformation');
const axios = require('axios').default;
const config = require('./config');

// Do the job
function dataCollector(mainWindow) {

	function collectorFlash(mainWindow, data) {
		message =  (data.message) ? data.message : null;
		loading = (data.loading) ? data.loading : null;
		lastSync = (data.lastSync) ? data.lastSync : null;

		if (mainWindow) {
			mainWindow.webContents.send('collector:flash', {
				message: message,
				loading: loading,
				lastSync: lastSync,
			});
		}
	}

	async function firstNetworkPass() {
		const ifaces = await sysinfo.networkInterfaces();

		for (let iface of ifaces) {
			const contents = await sysinfo.networkStats(iface.iface);
		}
	}

	async function collectAndReport(mainWindow, gateway, serverkey) {
		var post_data = "";

		const allData = await sysinfo.getAllData();
		const processes = await sysinfo.processes();
		const networkInterfaceDefault = await sysinfo.networkInterfaceDefault();
		const ifaces = await sysinfo.networkInterfaces();

		var networkStats = [];

		for (let iface of ifaces) {
			const contents = await sysinfo.networkStats(iface.iface);
			networkStats.push(contents);
		}

		agentVersion = config.get('agentVersion', '1.0.0');

		// Time
		time = new Date();
		post_data = post_data + "{time}" + time + "{/time}";

		// Uptime
		uptime = sysinfo.time().uptime;
		post_data = post_data + "{uptime}" + uptime + "{/uptime}";

		// Hostname
		hostname = allData.os.hostname;
		post_data = post_data + "{hostname}" + hostname + "{/hostname}";

		// Kernel
		kernel = allData.os.kernel;
		post_data = post_data + "{kernel}" + kernel + "{/kernel}";

		// Os
		os_name = allData.os.distro;
		post_data = post_data + "{os}" + os_name + "{/os}";

		// Os Arch
		os_arch = allData.os.arch;
		post_data = post_data + "{os_arch}" + os_arch + "{/os_arch}";

		// CPU Model
		cpu_model = allData.cpu.manufacturer + " " + allData.cpu.brand + " " + allData.cpu.speed + "GHz";
		post_data = post_data + "{cpu_model}" + cpu_model + "{/cpu_model}";

		// CPU Cores
		cpu_cores = allData.cpu.cores;
		post_data = post_data + "{cpu_cores}" + cpu_cores + "{/cpu_cores}";

		// CPU Speed
		cpu_speed = allData.cpu.speed;
		post_data = post_data + "{cpu_speed}" + cpu_speed + "{/cpu_speed}";

		// RAM Total
		ram_total = allData.mem.total;
		post_data = post_data + "{ram_total}" + ram_total + "{/ram_total}";

		// RAM Free
		ram_free = allData.mem.free;
		post_data = post_data + "{ram_free}" + ram_free + "{/ram_free}";

		// RAM Caches NOT IN WIN
		ram_caches = allData.mem.buffcache;
		post_data = post_data + "{ram_caches}" + ram_caches + "{/ram_caches}";

		// RAM Buffers NOT IN WIN
		ram_buffers = allData.mem.buffcache;
		post_data = post_data + "{ram_buffers}" + ram_buffers + "{/ram_buffers}";

		// RAM Usage
		ram_usage = allData.mem.used;
		post_data = post_data + "{ram_usage}" + ram_usage + "{/ram_usage}";

		// Swap Total
		swap_total = allData.mem.swaptotal;
		post_data = post_data + "{swap_total}" + swap_total + "{/swap_total}";

		// Swap Free
		swap_free = allData.mem.swapfree;
		post_data = post_data + "{swap_free}" + swap_free + "{/swap_free}";

		// Swap Usage
		swap_usage = allData.mem.swapused;
		post_data = post_data + "{swap_usage}" + swap_usage + "{/swap_usage}";

		// CPU Load
		cpu_load = JSON.stringify(allData.currentLoad);
		post_data = post_data + "{cpu_load}" + cpu_load + "{/cpu_load}";

		// Net Interfaces
		net_interfaces = JSON.stringify(allData.net);
		post_data = post_data + "{net_interfaces}" + net_interfaces + "{/net_interfaces}";

		// Net Stats
		net_stats = JSON.stringify(networkStats);
		post_data = post_data + "{net_stats}" + net_stats + "{/net_stats}";

		// Default Interface
		default_interface = networkInterfaceDefault;
		post_data = post_data + "{default_interface}" + default_interface + "{/default_interface}";

		// Processes
		processes_post = JSON.stringify(processes);
		post_data = post_data + "{processes}" + processes_post + "{/processes}";

		// Ping Latency
		ping_latency = allData.inetLatency;
		post_data = post_data + "{ping_latency}" + ping_latency + "{/ping_latency}";

		// Disks
		disk_layout = JSON.stringify(allData.diskLayout);
		post_data = post_data + "{disk_layout}" + disk_layout + "{/disk_layout}";

		// Filesystems
		filesystems = JSON.stringify(allData.fsSize);
		post_data = post_data + "{filesystems}" + filesystems + "{/filesystems}";

		// Network Connections
		network_connections = JSON.stringify(allData.networkConnections);
		post_data = post_data + "{network_connections}" + network_connections + "{/network_connections}";

		// System
		system = JSON.stringify(allData.system);
		post_data = post_data + "{system}" + system + "{/system}";

		// Bios
		bios = JSON.stringify(allData.bios);
		post_data = post_data + "{bios}" + bios + "{/bios}";

		// Baseboard
		baseboard = JSON.stringify(allData.baseboard);
		post_data = post_data + "{baseboard}" + baseboard + "{/baseboard}";

		collectorFlash(mainWindow, {
			message: 'Sending collected data...'
		});

		const instance = axios.create({
		  timeout: 1000,
		  headers: {
			'User-Agent': 'CubedAgent v'+ agentVersion +' (Electron)'
		  }
		});

		const timeElapsed = Date.now();
		const today = new Date(timeElapsed);
		const now = today.toISOString();

		instance.post(gateway, {
			serverkey: serverkey,
			data: post_data
		})
		.then(function (response) {
			// handle success

			collectorFlash(mainWindow, {
				message: 'Data sent successfully.'
			});

			config.set('lastSync', now);
		})
		.catch(function (error) {
			// handle error
			collectorFlash(mainWindow, {
				message: 'Error sending data to the server: ' + error.message
			});
		})
		.then(function () {
			// always executed
		});

		collectorFlash(mainWindow, {
			lastSync: now
		});
	}

	serverkey = config.get('serverkey');
	gateway = config.get('gateway');

	if (!serverkey) {
		collectorFlash(mainWindow, {
			message: 'You must provide a Server Key to start collecting data.'
		});
	} else if(!gateway) {
		collectorFlash(mainWindow, {
			message: 'You must define a Gateway to send the collected data.'
		});
	} else {
		collectorFlash(mainWindow, {
			message: 'Collecting data...'
		});

		// get networking data
		firstNetworkPass();

		// wait 1 second and run the main reporting function
		setTimeout(() => {
			collectAndReport(mainWindow, gateway, serverkey)
		}, 1000);
	}
}

module.exports = dataCollector;
