const fs = require('fs');
const path = require('path');

const sidebarPath = path.join(__dirname, '..', 'components', 'layout', 'Sidebar.tsx');
let sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

const target = `            </div>
          )}
        </div>
      </div>
    );
  };`;

const replacement = `            </div>
          )}

          {/* Powered by AutoHub Credit in Sidebar */}
          {!collapsed ? (
            <div className="px-4 py-2.5 text-[11px] text-slate-400 flex items-center justify-between border-t border-white/10 font-sans mt-2">
              <span className="text-slate-400">Nissan NZ © 2026</span>
              <span className="text-slate-400">
                Powered by <strong className="text-slate-200 font-semibold tracking-wide">AutoHub</strong>
              </span>
            </div>
          ) : (
            <div className="py-2 text-center border-t border-white/10 mt-2">
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider" title="Powered by AutoHub">
                AUTOHUB
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };`;

// Use regex matching indentation flexible
const targetRegex = /<\/div>\s*\}\)\s*<\/div>\s*<\/div>\s*\);\s*\};/;
// Let's test with simpler index find
const idx = sidebarContent.lastIndexOf('renderNavContent');
if (idx !== -1) {
  const afterIdx = sidebarContent.indexOf('return (', idx);
  const endNavContent = sidebarContent.indexOf('return (\n    <>', afterIdx);
  // Let's find `router.push("/");` near the end of renderNavContent
  const logoutIdx = sidebarContent.indexOf('router.push("/");', idx);
  if (logoutIdx !== -1) {
    const closingDivs = sidebarContent.indexOf('</div>\n        </div>\n      </div>\n    );', logoutIdx);
    if (closingDivs !== -1) {
      console.log('Found closingDivs!');
    }
  }
}

// Replace based on unique string
const oldEnd = `                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );`;

const newEnd = `                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Powered by AutoHub Credit in Sidebar */}
          {!collapsed ? (
            <div className="px-4 py-2.5 text-[11px] text-slate-400 flex items-center justify-between border-t border-white/10 font-sans mt-2">
              <span className="text-slate-400">Nissan NZ © 2026</span>
              <span className="text-slate-400">
                Powered by <strong className="text-slate-200 font-semibold tracking-wide">AutoHub</strong>
              </span>
            </div>
          ) : (
            <div className="py-2 text-center border-t border-white/10 mt-2">
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider" title="Powered by AutoHub">
                AUTOHUB
              </span>
            </div>
          )}
        </div>
      </div>
    );`;

// Normalize \r\n for matching
const normContent = sidebarContent.replace(/\r\n/g, '\n');
const normOld = oldEnd.replace(/\r\n/g, '\n');
const normNew = newEnd.replace(/\r\n/g, '\n');

if (normContent.includes(normOld)) {
  const updated = normContent.replace(normOld, normNew);
  fs.writeFileSync(sidebarPath, updated, 'utf8');
  console.log('Sidebar Powered by AutoHub credit inserted successfully!');
} else {
  console.log('Could not find exact block in Sidebar');
}

